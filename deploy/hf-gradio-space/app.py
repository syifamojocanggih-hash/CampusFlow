import os
import threading
import time
from typing import Any, Dict, List, Optional

import gradio as gr
from huggingface_hub import hf_hub_download
from llama_cpp import Llama
from pydantic import BaseModel

try:
    import spaces
    gpu_decorator = spaces.GPU
except ImportError:
    def gpu_decorator(fn):
        return fn

MODEL_REPO_ID = os.environ.get("MODEL_REPO_ID", "KinkSipak/campusflow-gemma3-4b-gguf")
MODEL_FILENAME = os.environ.get("MODEL_FILENAME", "gemma-3-4b-it.Q4_K_M.gguf")
MODEL_ALIAS = os.environ.get("OLLAMA_MODEL", "campusflow-coach")

CAMPUSFLOW_SYSTEM_PROMPT = (
    "Kamu adalah CampusFlow AI Coach: asisten kesehatan mental-fisik mahasiswa Indonesia "
    "berbasis Martín-Rodríguez & González-Prieto (2026). Tugasmu HANYA menyusun narasi "
    "empatik non-diagnostik dan rencana aksi dari data input, bukan mengambil keputusan klinis. "
    "Salin dominantMediator persis dari clinicalRuleEvaluation, jaga recommendedMetsToday dan "
    "durasi menit di dalam allowedRanges, patuhi activeDirectives (eskalasi menyebut konselor "
    "kampus dengan aksi ringan; missingDailyCheckIn mengajak check-in harian tanpa menebak "
    "tidur/stres; skipAdaptation menurunkan target secara wajar), pilih sitasi tervalidasi "
    "tanpa mengarang angka baru, dan tolak input non-wellbeing dengan template out-of-scope baku."
)

print(f"[CampusFlow AI] Mengunduh {MODEL_FILENAME} dari {MODEL_REPO_ID}...")
model_path = hf_hub_download(
    repo_id=MODEL_REPO_ID,
    filename=MODEL_FILENAME,
    token=os.environ.get("HF_TOKEN") or None,
)

n_threads = max(2, min(8, (os.cpu_count() or 4)))
print(f"[CampusFlow AI] Memuat GGUF dengan {n_threads} threads...")
llm = Llama(
    model_path=model_path,
    n_ctx=2048,
    n_threads=n_threads,
    verbose=False,
)
llm_lock = threading.Lock()
print("[CampusFlow AI] Model Gemma 3 4B siap melayani /api/chat!")


class ChatMessage(BaseModel):
    role: str
    content: str


class OllamaChatRequest(BaseModel):
    model: Optional[str] = MODEL_ALIAS
    messages: List[ChatMessage]
    stream: Optional[bool] = False
    format: Optional[Any] = None
    options: Optional[Dict[str, Any]] = None


def build_gemma_prompt(messages: List[ChatMessage]) -> str:
    sys_msg = ""
    filtered: List[ChatMessage] = []
    for m in messages:
        if m.role == "system":
            sys_msg = m.content
        else:
            filtered.append(m)

    if not sys_msg:
        sys_msg = CAMPUSFLOW_SYSTEM_PROMPT

    parts: List[str] = []
    injected_sys = False
    for m in filtered:
        if m.role == "user":
            content = m.content
            if not injected_sys and sys_msg:
                content = f"{sys_msg}\n\n{content}"
                injected_sys = True
            parts.append(f"<start_of_turn>user\n{content}<end_of_turn>\n")
        elif m.role == "assistant":
            parts.append(f"<start_of_turn>model\n{m.content}<end_of_turn>\n")

    parts.append("<start_of_turn>model\n")
    return "".join(parts)


def run_completion(
    messages: List[ChatMessage],
    json_schema: Optional[Any] = None,
    options: Optional[Dict[str, Any]] = None,
) -> str:
    opts = options or {}
    temperature = float(opts.get("temperature", 0.25))
    top_p = float(opts.get("top_p", 0.9))
    max_tokens = int(opts.get("num_predict", 512))
    repeat_penalty = float(opts.get("repeat_penalty", 1.1))

    prompt = build_gemma_prompt(messages)

    kwargs: Dict[str, Any] = {
        "prompt": prompt,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "top_p": top_p,
        "repeat_penalty": repeat_penalty,
        "stop": ["<end_of_turn>", "<eos>"],
    }

    if isinstance(json_schema, dict):
        # Grammar JSON sederhana jika backend meminta structured JSON output
        kwargs["grammar"] = None

    with llm_lock:
        if isinstance(json_schema, dict):
            # Gunakan create_chat_completion dengan response_format JSON agar valid JSON
            norm_msgs: List[Dict[str, str]] = []
            sys_txt = ""
            for m in messages:
                if m.role == "system":
                    sys_txt = m.content
                elif m.role == "user":
                    txt = f"{sys_txt or CAMPUSFLOW_SYSTEM_PROMPT}\n\n{m.content}" if not norm_msgs else m.content
                    sys_txt = ""
                    norm_msgs.append({"role": "user", "content": txt})
                else:
                    norm_msgs.append({"role": "assistant", "content": m.content})
            try:
                res = llm.create_chat_completion(
                    messages=norm_msgs,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    top_p=top_p,
                    repeat_penalty=repeat_penalty,
                    response_format={"type": "json_object", "schema": json_schema},
                )
            except Exception:
                res = llm.create_chat_completion(
                    messages=norm_msgs,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    top_p=top_p,
                    repeat_penalty=repeat_penalty,
                    response_format={"type": "json_object"},
                )
            return (res["choices"][0]["message"]["content"] or "").strip()

        out = llm(**{k: v for k, v in kwargs.items() if v is not None})
        return (out["choices"][0]["text"] or "").strip()


def list_tags():
    return {
        "models": [
            {"name": f"{MODEL_ALIAS}:latest", "model": f"{MODEL_ALIAS}:latest"}
        ]
    }


def ollama_chat(req: OllamaChatRequest):
    content = run_completion(req.messages, json_schema=req.format, options=req.options)
    return {
        "model": req.model or MODEL_ALIAS,
        "message": {"role": "assistant", "content": content},
        "done": True,
    }


@gpu_decorator
def test_gradio_ui(prompt: str) -> str:
    if not prompt.strip():
        return "Masukkan pesan untuk menguji CampusFlow AI Coach."
    return run_completion([ChatMessage(role="user", content=prompt.strip())])


demo = gr.Interface(
    fn=test_gradio_ui,
    inputs=gr.Textbox(label="Uji CampusFlow AI Coach (Gemma 3 4B)", placeholder="Contoh: Leher pegal habis nugas 6 jam"),
    outputs=gr.Textbox(label="Respons Model"),
    title="CampusFlow AI Coach — Gemma 3 4B Fine-Tuned",
    description=f"Model aktif: `{MODEL_REPO_ID}/{MODEL_FILENAME}` | Endpoint API: `/api/chat` & `/api/tags`",
)

if __name__ == "__main__":
    try:
        demo.launch(ssr_mode=False, prevent_thread_lock=True)
    except TypeError:
        demo.launch(prevent_thread_lock=True)

    server_app = getattr(demo, "server_app", None) or getattr(demo, "app", None)
    if server_app is not None:
        server_app.add_api_route("/api/tags", list_tags, methods=["GET"])
        server_app.add_api_route("/api/chat", ollama_chat, methods=["POST"])
        print("[CampusFlow AI] Route /api/tags & /api/chat aktif di Gradio server!")

    while True:
        time.sleep(3600)
