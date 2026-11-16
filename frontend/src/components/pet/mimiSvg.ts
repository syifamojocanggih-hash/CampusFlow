export type PetMood = "happy" | "sad" | "sleepy" | "excited";

const K = 'stroke="#1A1A1A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"';
const PK = "#F7A8B0";
const CR = "#FFF6E0";
const YE = "#FFF29A";
const MI = "#CDE8B5";
const BL = "#BDE6F0";

function star(t: string): string {
  return `<path transform="${t}" d="M0 -10 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="${YE}" stroke="#1A1A1A" stroke-width="2.5" stroke-linejoin="round"/>`;
}

/**
 * Generate Mimi SVG markup based on stage and mood
 * @param st Stage index: 0 (Biji), 1 (Tunas), 2 (Kuncup), 3 (Mekar), 6 (Legenda)
 * @param m Mood: 'happy' | 'sad' | 'sleepy' | 'excited'
 * @param crack Boolean indicating if seed is cracked (has progress)
 */
export function getMimiSvg(st: number, m: PetMood = "happy", crack: boolean = false): string {
  let s = '<svg viewBox="0 0 200 200" role="img" aria-label="Mimi Pet" class="w-full h-full select-none pointer-events-none">';
  const SO = "#E7B48C";
  const leaf = (x: number, y: number, r: number, w: number) =>
    `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * 0.55}" transform="rotate(${r} ${x} ${y})" fill="${MI}" ${K} stroke-width="3"/>`;

  s += '<ellipse cx="100" cy="190" rx="58" ry="8" fill="#000" fill-opacity=".08"/>';

  if (st === 0) {
    s += `<path d="M100 92C128 92 138 124 138 146C138 168 122 178 100 178C78 178 62 168 62 146C62 124 72 92 100 92Z" fill="${CR}" ${K}/>`;
    s += `<circle cx="84" cy="116" r="5" fill="${BL}"/><circle cx="120" cy="124" r="6" fill="${PK}"/>`;
    if (crack) {
      s += `<path d="M100 94v-16" fill="none" ${K} stroke-width="3.5"/>` + leaf(91, 74, -30, 11) + leaf(109, 74, 30, 11);
    }
    s += `<ellipse cx="100" cy="182" rx="66" ry="17" fill="${SO}" ${K}/>`;
    s +=
      m === "sad"
        ? `<path d="M78 138q6-6 12 0M110 138q6-6 12 0" fill="none" ${K} stroke-width="3"/>`
        : `<path d="M78 134q6 6 12 0M110 134q6 6 12 0" fill="none" ${K} stroke-width="3"/>`;
    s += `<ellipse cx="72" cy="148" rx="8" ry="5" fill="${PK}"/><ellipse cx="128" cy="148" rx="8" ry="5" fill="${PK}"/>`;
    if (m === "sleepy") {
      s += '<text x="144" y="86" font-size="24" font-weight="800" font-family="sans-serif" fill="#1A1A1A">z</text>';
    }
    return s + "</svg>";
  }

  const up = m === "excited";
  const sc = [0, 0.62, 0.72, 0.82, 0.9, 0.95, 1][st] || 0.72;
  const BODY = ["", "#FFE9ED", "#FFDDE3", "#FBCFD8", "#F4C2DD", "#E3C0EE", "#FFE08A"][st] || "#FFDDE3";

  s += `<g transform="translate(100 190) scale(${sc}) translate(-100 -190)">`;
  if (st === 6) {
    s += `<circle cx="100" cy="116" r="98" fill="#fff" fill-opacity=".5"/><path d="M6 120A94 94 0 0 1 194 120" fill="none" stroke="${PK}" stroke-width="7" stroke-linecap="round"/><path d="M16 120A84 84 0 0 1 184 120" fill="none" stroke="${YE}" stroke-width="7" stroke-linecap="round"/><path d="M26 120A74 74 0 0 1 174 120" fill="none" stroke="${BL}" stroke-width="7" stroke-linecap="round"/>`;
  }
  s += `<ellipse cx="${up ? 32 : 36}" cy="${up ? 116 : 140}" rx="9" ry="14" transform="rotate(${up ? -35 : 20} ${up ? 32 : 36} ${up ? 116 : 140})" fill="${BODY}" ${K}/>`;
  s += `<ellipse cx="${up ? 168 : 164}" cy="${up ? 116 : 140}" rx="9" ry="14" transform="rotate(${up ? 35 : -20} ${up ? 168 : 164} ${up ? 116 : 140})" fill="${BODY}" ${K}/>`;
  s += `<ellipse cx="78" cy="187" rx="13" ry="6.5" fill="${PK}" ${K} stroke-width="3"/><ellipse cx="122" cy="187" rx="13" ry="6.5" fill="${PK}" ${K} stroke-width="3"/>`;
  s += `<path d="M38 130C38 84 66 72 100 72C134 72 162 84 162 130C162 168 136 186 100 186C64 186 38 168 38 130Z" fill="${BODY}" ${K}/><ellipse cx="100" cy="156" rx="26" ry="16" fill="#fff" fill-opacity=".6"/>`;

  const stemLen = [0, 16, 34, 26, 26, 22, 30][st] || 20;
  s += `<path d="M100 72v-${stemLen}" fill="none" ${K}/>`;

  if (st === 1) {
    s += leaf(90, 54, -35, 13) + leaf(110, 54, 35, 13);
  }
  if (st === 2) {
    s += leaf(88, 58, -35, 14) + leaf(112, 58, 35, 14) + `<path d="M100 14q14 14 0 28q-14-14 0-28z" fill="${PK}" ${K} stroke-width="3"/>`;
  }
  if (st === 3 || st === 4 || st === 6) {
    s += leaf(88, 62, -35, 14) + leaf(112, 62, 35, 14);
    for (let a = 0; a < 5; a++) {
      s += `<circle cx="${(100 + 13 * Math.cos(a * 1.2566 - 1.5708)).toFixed(1)}" cy="${(34 + 13 * Math.sin(a * 1.2566 - 1.5708)).toFixed(1)}" r="9" fill="${PK}" ${K} stroke-width="3"/>`;
    }
    s += `<circle cx="100" cy="34" r="8" fill="${YE}" ${K} stroke-width="3"/>`;
  }

  const bf = (x: number, y: number) =>
    `<ellipse cx="${x - 6}" cy="${y}" rx="7" ry="5" transform="rotate(-20 ${x - 6} ${y})" fill="${BL}" ${K} stroke-width="2.5"/><ellipse cx="${x + 6}" cy="${y}" rx="7" ry="5" transform="rotate(20 ${x + 6} ${y})" fill="${BL}" ${K} stroke-width="2.5"/><path d="M${x} ${y - 4}v8" ${K} stroke-width="2.5"/>`;
  const mini = (x: number, y: number) =>
    `<circle cx="${x}" cy="${y}" r="6" fill="${PK}" ${K} stroke-width="2.5"/><circle cx="${x}" cy="${y}" r="2.5" fill="${YE}"/>`;

  if (st === 4) {
    s += mini(70, 52) + mini(130, 52) + bf(162, 40);
  }
  if (st === 5) {
    s += `<circle cx="82" cy="48" r="15" fill="${MI}" ${K} stroke-width="3.5"/><circle cx="118" cy="48" r="15" fill="${MI}" ${K} stroke-width="3.5"/><circle cx="100" cy="30" r="18" fill="${MI}" ${K} stroke-width="3.5"/>`;
    [
      [92, 26],
      [114, 34],
      [80, 52],
      [120, 54],
      [100, 48],
    ].forEach((p) => {
      s += `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="${PK}" stroke="#1A1A1A" stroke-width="2"/>`;
    });
    s += bf(164, 48);
  }
  if (st === 6) {
    s += `<polygon transform="rotate(-18 66 80)" points="50,88 52,70 60,79 66,67 72,79 80,70 82,88" fill="${YE}" ${K} stroke-width="3"/>`;
  }

  if (m === "excited") {
    s += `<path d="M64 128q12-16 24 0M112 128q12-16 24 0" fill="none" ${K}/>`;
  } else if (m === "sleepy") {
    s += `<path d="M65 126q11 10 22 0M113 126q11 10 22 0" fill="none" ${K}/>`;
  } else {
    s += `<ellipse cx="76" cy="126" rx="11" ry="13" fill="#1A1A1A"/><ellipse cx="124" cy="126" rx="11" ry="13" fill="#1A1A1A"/><circle cx="80" cy="120" r="${m === "sad" ? 5.6 : 4.6}" fill="#fff"/><circle cx="72" cy="131" r="2.2" fill="#fff"/><circle cx="128" cy="120" r="${m === "sad" ? 5.6 : 4.6}" fill="#fff"/><circle cx="120" cy="131" r="2.2" fill="#fff"/>`;
  }

  if (m === "sad") {
    s += `<path d="M64 142q-5 10 0 14q5-4 0-14z" fill="${BL}" stroke="#1A1A1A" stroke-width="2"/>`;
  }
  s += `<ellipse cx="54" cy="146" rx="11" ry="7" fill="${PK}" fill-opacity=".85"/><ellipse cx="146" cy="146" rx="11" ry="7" fill="${PK}" fill-opacity=".85"/>`;

  if (m === "excited") {
    s += `<path d="M90 138q10 18 20 0z" fill="#1A1A1A" ${K} stroke-width="3"/>`;
  } else if (m === "sleepy") {
    s += `<ellipse cx="100" cy="142" rx="3.5" ry="4.5" fill="#1A1A1A"/>`;
  } else if (m === "sad") {
    s += `<path d="M92 148q8-8 16 0" fill="none" ${K} stroke-width="3.5"/>`;
  } else {
    s += `<path d="M92 140q4 6 8 0q4 6 8 0" fill="none" ${K} stroke-width="3.5"/>`;
  }

  if (m === "sleepy") {
    s += '<text x="148" y="76" font-size="26" font-weight="800" font-family="sans-serif" fill="#1A1A1A">z</text>';
  }
  if (st >= 3 || m === "excited") {
    s += star("translate(30 66)") + star("translate(172 74) scale(.8)");
  }

  s += "</g></svg>";
  return s;
}

export const STAGE_MAP = [0, 1, 2, 3, 6];
export const STAGE_NAMES = ["Biji", "Tunas", "Kuncup", "Mekar", "Legenda"];
export const STAGE_STARTS = [3, 10, 20, 50, 100];
export const STAGE_LOOKS = [
  "Biji kecil yang tertidur di tanah",
  "Ukuran 62%, daun mungil pink pucat",
  "Ukuran 72%, kuncup bunga pink lembut",
  "Ukuran 82%, mekar dengan pink hangat",
  "Ukuran penuh, mahkota emas dan pelangi",
];
export const STAGE_BENEFITS = [
  "Pilih nama & salam untuk Mimi",
  "Stiker Mimi di pojok dashboard",
  "1 Streak Freeze untuk melindungi streak",
  "Tema pastel khusus untuk Mimi",
  "Lencana Legenda & sertifikat kebugaran kampus",
];

export const PET_CHATS = [
  "Hehe, geli!",
  "Aku di sini menemani belajar.",
  "Sudah minum air belum?",
  "Pegal? Yuk berdiri sebentar.",
  "Peluk dulu dong!",
  "Postur tegak, masa depan cerah!",
  "Langkah kecil hari ini, sehat selamanya.",
];
