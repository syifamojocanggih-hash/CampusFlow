import React from "react";

export interface BackgroundDoodlesProps {
  className?: string;
  opacity?: number;
}

/**
 * BackgroundDoodles
 * Pola doodle vektor bertema akademik, aktivitas gerak (Strava), dan kesehatan mental (Fresh Pastel).
 * Diletakkan di latar belakang seluruh halaman aplikasi terautentikasi (z-0, pointer-events-none),
 * dan secara sengaja TIDAK ditampilkan pada Landing Page, Login, maupun Register modal.
 */
export const BackgroundDoodles: React.FC<BackgroundDoodlesProps> = ({
  className = "",
  opacity = 1,
}) => {
  return (
    <div
      className={`fixed inset-0 pointer-events-none select-none z-0 overflow-hidden ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="campusflow-academic-doodles"
            width="420"
            height="420"
            patternUnits="userSpaceOnUse"
          >
            {/* GRP: Shared Stroke Styling for hand-drawn look */}
            <g
              stroke="#1A1A1A"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.055"
            >
              {/* ========================================================
                  1. BUKU TERBUKA (KULIAH / AKADEMIK) - top left (40, 45)
                  ======================================================== */}
              {/* Lembar Halaman Kiri */}
              <path
                d="M 38 48 C 50 43, 68 45, 78 50 C 74 66, 74 78, 78 83 C 68 78, 50 76, 38 81 Z"
                fill="#FFF29A"
                fillOpacity="0.22"
              />
              {/* Lembar Halaman Kanan */}
              <path
                d="M 78 50 C 88 45, 106 43, 118 48 L 118 81 C 106 76, 88 78, 78 83 Z"
                fill="#FFF29A"
                fillOpacity="0.22"
              />
              {/* Garis Tulisan / Teks Kuliah */}
              <path d="M 46 56 L 68 54 M 46 64 L 70 62 M 46 72 L 62 70" />
              <path d="M 88 54 L 110 56 M 86 62 L 110 64 M 94 70 L 110 72" />

              {/* ========================================================
                  2. TUNAS MIMI / SEEDLING (GROWTH & WELLBEING) - (180, 40)
                  ======================================================== */}
              <path d="M 180 62 C 180 50, 183 42, 185 36" />
              {/* Daun Kiri */}
              <path
                d="M 185 42 C 172 40, 164 47, 169 53 C 176 56, 183 48, 185 42 Z"
                fill="#CDE8B5"
                fillOpacity="0.30"
              />
              {/* Daun Kanan */}
              <path
                d="M 185 37 C 193 29, 202 31, 204 39 C 201 45, 193 45, 185 37 Z"
                fill="#CDE8B5"
                fillOpacity="0.30"
              />

              {/* ========================================================
                  3. CANGKIR KOPI / TEH HANGAT (JEDA RECOVERY) - (290, 48)
                  ======================================================== */}
              {/* Badan Cangkir */}
              <path
                d="M 285 46 L 285 68 C 285 77, 301 77, 301 68 L 301 46 Z"
                fill="#FFF29A"
                fillOpacity="0.25"
              />
              {/* Pegangan Cangkir */}
              <path d="M 301 51 C 309 51, 309 63, 301 63" />
              {/* Tatakan */}
              <path d="M 279 74 L 307 74" />
              {/* Uap Hangat */}
              <path d="M 289 39 C 287 35, 291 32, 289 28" />
              <path d="M 296 40 C 294 36, 298 33, 296 29" />

              {/* ========================================================
                  4. SPARKLE BINTANG 4-TITIK - (368, 52)
                  ======================================================== */}
              <path
                d="M 368 44 Q 368 52 360 52 Q 368 52 368 60 Q 368 52 376 52 Q 368 52 368 44 Z"
                fill="#FFD97D"
                fillOpacity="0.35"
              />

              {/* ========================================================
                  5. SEPATU SNEAKER (ACADEMIC STRAVA / STEPS) - (72, 148)
                  ======================================================== */}
              <path
                d="M 52 162 C 64 163, 86 163, 96 158 C 98 156, 98 152, 92 151 L 82 151 L 74 141 L 58 144 L 54 154 Z"
                fill="#BDE6F0"
                fillOpacity="0.25"
              />
              <path d="M 68 145 L 73 148 M 71 142 L 76 145" />
              <path d="M 50 163 L 98 160" />

              {/* ========================================================
                  6. PENSIL DENGAN CORETAN GELOMBANG - (185, 140)
                  ======================================================== */}
              <g transform="rotate(-35 185 140)">
                {/* Batang Pensil */}
                <rect
                  x="172"
                  y="134"
                  width="26"
                  height="7"
                  rx="1"
                  fill="#FFF29A"
                  fillOpacity="0.28"
                />
                {/* Ujung Kayu & Mata Pensil */}
                <path d="M 198 134 L 206 137.5 L 198 141 Z" />
                <path d="M 203 136 L 206 137.5 L 203 139 Z" fill="#1A1A1A" fillOpacity="0.1" />
                {/* Penghapus */}
                <path
                  d="M 172 134 L 168 134 C 166 134, 166 141, 168 141 L 172 141 Z"
                  fill="#F7A8B0"
                  fillOpacity="0.3"
                />
              </g>
              {/* Jejak Coretan */}
              <path d="M 206 150 C 215 154, 222 146, 214 142 C 206 138, 208 149, 218 152" />

              {/* ========================================================
                  7. AWAN ISTIRAHAT & "Zzz" (TIDUR / RECOVERY) - (285, 142)
                  ======================================================== */}
              <path
                d="M 270 148 C 265 148, 262 142, 266 137 C 264 129, 273 126, 277 129 C 282 124, 290 124, 293 130 C 299 130, 301 136, 298 141 C 303 145, 299 150, 294 149 Z"
                fill="#BDE6F0"
                fillOpacity="0.22"
              />
              {/* Simbol Zzz */}
              <path d="M 307 128 L 313 128 L 307 135 L 313 135" strokeWidth="1.2" />
              <path d="M 315 120 L 320 120 L 315 125 L 320 125" strokeWidth="1" />
              <path d="M 322 113 L 325 113 L 322 117 L 325 117" strokeWidth="0.8" />

              {/* ========================================================
                  8. TETESAN AIR (HIDRASI SEHAT) - (378, 148)
                  ======================================================== */}
              <path
                d="M 378 134 C 378 134, 369 146, 369 152 C 369 157, 373 161, 378 161 C 383 161, 387 157, 387 152 C 387 146, 378 134, 378 134 Z"
                fill="#BDE6F0"
                fillOpacity="0.32"
              />

              {/* ========================================================
                  9. HATI DENGAN DETAK PULSE (WELLBEING) - (48, 246)
                  ======================================================== */}
              <path
                d="M 48 244 C 48 237, 38 232, 31 238 C 23 246, 31 257, 48 267 C 65 257, 73 246, 65 238 C 58 232, 48 237, 48 244 Z"
                fill="#F7A8B0"
                fillOpacity="0.25"
              />
              {/* Garis Pulse / Detak Jantung */}
              <path d="M 18 252 L 28 252 L 32 246 L 37 258 L 41 250 L 45 252 L 78 252" />

              {/* ========================================================
                  10. POMODORO / STOPWATCH TIMER - (155, 248)
                  ======================================================== */}
              <circle
                cx="155"
                cy="248"
                r="16"
                fill="#FFF29A"
                fillOpacity="0.18"
              />
              <path d="M 152 230 L 158 230 M 155 230 L 155 232" />
              <path d="M 155 248 L 155 239 M 155 248 L 162 248" />
              <circle cx="155" cy="248" r="1.5" fill="#1A1A1A" fillOpacity="0.15" />

              {/* ========================================================
                  11. TOPI TOGA / MORTARBOARD WISUDA - (265, 242)
                  ======================================================== */}
              {/* Belah Ketupat Atas */}
              <path
                d="M 265 230 L 286 238 L 265 246 L 244 238 Z"
                fill="#CDE8B5"
                fillOpacity="0.22"
              />
              {/* Mangkok Topi Bawah */}
              <path d="M 252 241 L 252 248 C 252 253, 278 253, 278 248 L 278 241" />
              {/* Tali Tassel */}
              <path d="M 265 238 L 243 244 L 242 253" />

              {/* ========================================================
                  12. PETIR ENERGI / ZAP (FOCUS VITALITY) - (362, 245)
                  ======================================================== */}
              <path
                d="M 364 232 L 352 247 L 360 247 L 355 264 L 372 245 L 363 245 Z"
                fill="#FFF29A"
                fillOpacity="0.35"
              />

              {/* ========================================================
                  13. BOLA LAMPU / IDE EUREKA (KOGNITIF) - (62, 345)
                  ======================================================== */}
              <path
                d="M 54 350 C 47 344, 46 334, 52 327 C 58 320, 68 320, 74 327 C 80 334, 79 344, 72 350 L 71 356 L 55 356 Z"
                fill="#FFF29A"
                fillOpacity="0.28"
              />
              <path d="M 57 359 L 69 359 M 59 362 L 67 362" />
              {/* Pijar Cahaya */}
              <path d="M 63 315 L 63 319 M 44 323 L 48 326 M 82 323 L 78 326" />

              {/* ========================================================
                  14. BUNGA DAISY / FRESH PASTEL ACCENT - (168, 345)
                  ======================================================== */}
              {/* Kelopak Bunga Pastel */}
              <path
                d="M 168 338 C 165 338 165 342 168 342 C 171 342 171 338 168 338 Z
                   M 174 342 C 174 339 178 339 178 342 C 178 345 174 345 174 342 Z
                   M 172 349 C 174 351 172 355 169 353 C 167 351 169 347 172 349 Z
                   M 164 349 C 162 347 164 351 161 353 C 158 351 161 347 164 349 Z
                   M 162 342 C 162 345 158 345 158 342 C 158 339 162 339 162 342 Z"
                fill="#F7A8B0"
                fillOpacity="0.30"
              />
              {/* Inti Bunga */}
              <circle cx="168" cy="344" r="3.5" fill="#FFD97D" fillOpacity="0.45" />

              {/* ========================================================
                  15. STICKY NOTE / KERTAS CATATAN - (278, 345)
                  ======================================================== */}
              <path
                d="M 262 332 L 288 332 L 298 342 L 298 366 L 262 366 Z"
                fill="#FFF29A"
                fillOpacity="0.22"
              />
              <path d="M 288 332 L 288 342 L 298 342" />
              {/* Garis Checklist */}
              <path d="M 269 342 L 282 342 M 269 350 L 290 350 M 269 358 L 284 358" />

              {/* ========================================================
                  16. MATA FOKUS / VISION LAB (POSTUR & ERGONOMI) - (368, 345)
                  ======================================================== */}
              <path
                d="M 352 345 Q 368 334 384 345 Q 368 356 352 345 Z"
                fill="#BDE6F0"
                fillOpacity="0.22"
              />
              <circle cx="368" cy="345" r="4" fill="#1A1A1A" fillOpacity="0.10" />

              {/* ========================================================
                  17. ORNAMEN TAMBAHAN (SPARKLES, LOOP SQUIGGLES & DOTS)
                  ======================================================== */}
              {/* Mini Sparkles */}
              <path d="M 120 86 L 121 89 L 124 90 L 121 91 L 120 94 L 119 91 L 116 90 L 119 89 Z" fill="#FFD97D" fillOpacity="0.4" />
              <path d="M 334 94 L 335 97 L 338 98 L 335 99 L 334 102 L 333 99 L 330 98 L 333 97 Z" fill="#FFD97D" fillOpacity="0.35" />
              <path d="M 224 286 L 225 289 L 228 290 L 225 291 L 224 294 L 223 291 L 220 290 L 223 289 Z" fill="#FFD97D" fillOpacity="0.35" />
              <path d="M 390 286 L 391 289 L 394 290 L 391 291 L 390 294 L 389 291 L 386 290 L 389 289 Z" fill="#FFD97D" fillOpacity="0.35" />

              {/* Gelombang / Spiral Lucu */}
              <path d="M 218 92 Q 228 82 234 96 T 248 96" />
              <path d="M 104 192 Q 116 184 126 196" />
              <path d="M 326 195 Q 338 189 350 196" strokeDasharray="3 3" />
              <path d="M 205 292 C 209 284, 218 286, 216 294 C 214 300, 206 298, 208 293" />

              {/* Mini Heart Accent */}
              <path
                d="M 116 290 C 116 286, 110 283, 106 287 C 101 292, 106 298, 116 304 C 126 298, 131 292, 126 287 C 122 283, 116 286, 116 290 Z"
                fill="#F7A8B0"
                fillOpacity="0.25"
              />

              {/* Cluster Dot Halus */}
              <circle cx="325" cy="80" r="1.5" fill="#1A1A1A" fillOpacity="0.08" />
              <circle cx="332" cy="78" r="1.5" fill="#1A1A1A" fillOpacity="0.08" />
              <circle cx="329" cy="86" r="1.5" fill="#1A1A1A" fillOpacity="0.08" />

              <circle cx="118" cy="380" r="1.5" fill="#1A1A1A" fillOpacity="0.08" />
              <circle cx="125" cy="382" r="1.5" fill="#1A1A1A" fillOpacity="0.08" />
              <circle cx="121" cy="388" r="1.5" fill="#1A1A1A" fillOpacity="0.08" />
            </g>
          </pattern>
        </defs>

        {/* Fill whole screen with the repeating seamless academic doodles pattern */}
        <rect
          width="100%"
          height="100%"
          fill="url(#campusflow-academic-doodles)"
        />
      </svg>
    </div>
  );
};
