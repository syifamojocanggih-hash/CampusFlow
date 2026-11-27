import glob
import json
import os
import sys
import threading
import time
from typing import Any, Dict, List, Optional

import gradio as gr
from huggingface_hub import hf_hub_download
from pydantic import BaseModel

try:
    import spaces

    def gpu_decorator(fn):
        return spaces.GPU(duration=60)(fn)
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
print(f"[CampusFlow AI] GGUF siap di {model_path}")

_llm: Any = None
_llm_lock = threading.Lock()


def _preload_nvidia_libs() -> None:
    import ctypes
    site_pkgs = next((p for p in sys.path if p.endswith("site-packages")), None)
    if not site_pkgs:
        return
    lib_dirs = glob.glob(os.path.join(site_pkgs, "nvidia", "*", "lib"))
    if lib_dirs:
        cur_ld = os.environ.get("LD_LIBRARY_PATH", "")
        os.environ["LD_LIBRARY_PATH"] = ":".join(lib_dirs + ([cur_ld] if cur_ld else []))
        for name in ("libcudart.so.13", "libcublasLt.so.13", "libcublas.so.13"):
            for d in lib_dirs:
                candidate = os.path.join(d, name)
                if os.path.exists(candidate):
                    try:
                        ctypes.CDLL(candidate, mode=ctypes.RTLD_GLOBAL)
                    except OSError:
                        pass


def get_gpu_llm():
    global _llm
    if _llm is None:
        with _llm_lock:
            if _llm is None:
                _preload_nvidia_libs()
                from llama_cpp import Llama
                print("[CampusFlow AI] Memuat GGUF ke GPU A10G (n_gpu_layers=-1)...")
                _llm = Llama(
                    model_path=model_path,
                    n_ctx=2048,
                    n_gpu_layers=-1,
                    verbose=False,
                )
    return _llm


class ChatMessage(BaseModel):
    role: str
    content: str


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

    llm = get_gpu_llm()

    with _llm_lock:
        if isinstance(json_schema, dict):
            norm_msgs: List[Dict[str, str]] = []
            sys_txt = ""
            for m in messages:
                if m.role == "system":
                    sys_txt = m.content
                elif m.role == "user":
                    txt = f"{sys_txt}\n\n{m.content}" if sys_txt and not norm_msgs else m.content
                    norm_msgs.append({"role": "user", "content": txt})
                elif m.role == "assistant":
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

        prompt = build_gemma_prompt(messages)
        out = llm(
            prompt=prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            repeat_penalty=repeat_penalty,
            stop=["<end_of_turn>", "<eos>"],
        )
        return (out["choices"][0]["text"] or "").strip()


def list_tags():
    return {
        "models": [
            {"name": f"{MODEL_ALIAS}:latest", "model": f"{MODEL_ALIAS}:latest"}
        ]
    }


@gpu_decorator
def gpu_chat_api(payload_json: str) -> str:
    data = json.loads(payload_json)
    msgs = [ChatMessage(**m) for m in data.get("messages", [])]
    content = run_completion(
        msgs,
        json_schema=data.get("format"),
        options=data.get("options"),
    )
    return json.dumps(
        {
            "model": data.get("model") or MODEL_ALIAS,
            "message": {"role": "assistant", "content": content},
            "done": True,
        },
        ensure_ascii=False,
    )


@gpu_decorator
def test_gradio_ui(prompt: str) -> str:
    if not prompt.strip():
        return "Masukkan pesan untuk menguji CampusFlow AI Coach."
    return run_completion([ChatMessage(role="user", content=prompt.strip())])


with gr.Blocks(title="CampusFlow AI Coach — Gemma 3 4B Fine-Tuned") as demo:
    gr.Markdown(
        f"# CampusFlow AI Coach — Gemma 3 4B Fine-Tuned\n"
        f"Model aktif: `{MODEL_REPO_ID}/{MODEL_FILENAME}` (ZeroGPU A10G) | "
        f"API: `/gradio_api/call/chat_api` & `/api/tags`"
    )
    with gr.Row():
        ui_in = gr.Textbox(
            label="Uji CampusFlow AI Coach (Gemma 3 4B)",
            placeholder="Contoh: Leher pegal habis nugas 6 jam",
        )
        ui_out = gr.Textbox(label="Respons Model")
    ui_btn = gr.Button("Kirim")
    ui_btn.click(fn=test_gradio_ui, inputs=ui_in, outputs=ui_out)

    api_in = gr.Textbox(visible=False)
    api_out = gr.Textbox(visible=False)
    api_btn = gr.Button(visible=False)
    api_btn.click(fn=gpu_chat_api, inputs=api_in, outputs=api_out, api_name="chat_api")


if __name__ == "__main__":
    try:
        demo.launch(ssr_mode=False, prevent_thread_lock=True)
    except TypeError:
        demo.launch(prevent_thread_lock=True)

    server_app = getattr(demo, "server_app", None) or getattr(demo, "app", None)
    if server_app is not None:
        server_app.add_api_route("/api/tags", list_tags, methods=["GET"])
        print("[CampusFlow AI] Route /api/tags & Gradio GPU /gradio_api/call/chat_api aktif!")

    while True:
        time.sleep(3600)
