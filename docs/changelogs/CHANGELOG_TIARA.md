# Changelog — Tiara / Mutiara Dewanda Prisvilla (`@mutiaradewanda`)

> **Peran:** Frontend & PWA Experience Engineer  
> **Branch Kerja:** `frontend` (`frontend/`, `docs/frontend/`)  
> **Aturan:** Hanya Tiara yang mengisi file ini. Setiap push/PR di branch `frontend` wajib menambahkan entri di sini. Jika mengubah file di luar zona default `frontend/` atau `docs/frontend/`, WAJIB menyertakan tag `[CROSS-SCOPE]`, path lengkap file, dan alasannya.

---

## Format Contoh Entri *(Salin saat menambah perubahan baru di atas bagian ini)*

```markdown
## [YYYY-MM-DD] — Judul Fitur / Perbaikan (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.1`
- **Ringkasan:** Membangun komponen TriadDashboard dan integrasi status pill 24-Hour Movement.
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `docs/frontend/UI_COMPONENTS.md`
- **Catatan Cross-Scope:** *(Hapus baris ini jika tidak ada, atau tulis `[CROSS-SCOPE] path/file — alasan`)*
- **Verifikasi:** `npm --prefix frontend run build` berhasil tanpa error TypeScript.
```

---

## [2026-11-25] — Standardisasi Seluruh Tombol Aksi, Badge Ikon & Pill Aktivitas ke Palet Hijau Sage (`PedometerCard.tsx`, `ActivityView.tsx`, `PanicReliefMode.tsx`, `NotificationPopover.tsx`, `Navbar.tsx`, `TriadDashboard.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.84`
- **Ringkasan:**
  1. **Penyelarasan Warna Kartu Pencatat Cepat Aktivitas Fisik (`PedometerCard.tsx`):**
     - Mengubah warna 3 tombol aksi cepat "Catat" (Naik Tangga, Bersepeda, Olahraga Sore) menjadi hijau sage proyek (`bg-[#CFD8C4] hover:bg-[#BCC8AE] active:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE]`).
     - Mengubah badge MET-m (`+40 MET-m`, `+90 MET-m`, `+180 MET-m`) dan squircle ikon (`TrendingUp`, tangga, `Bike`, `Globe`, `Footprints`) ke palet hijau sage (`bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E]`).
     - Menyesuaikan tombol toggle sensor gerak HP menjadi hijau sage saat idle dan sage aktif saat tracking.
  2. **Harmonisasi Elemen Badge & Tombol Lintas Komponen:**
     - `ActivityView.tsx`: Menyelaraskan pill streak hari konsisten dan badge centang hari ke palet hijau sage (`#CFD8C4` & `#BCC8AE`).
     - `PanicReliefMode.tsx`: Mengubah tombol kontrol "Mulai Protokol", tombol selesaikan sesi +50 XP, dan badge protokol ke palet hijau sage.
     - `NotificationPopover.tsx`: Memperbarui badge kategori notifikasi dan dot indikator pesan baru ke hijau sage.
     - `Navbar.tsx` & `TriadDashboard.tsx`: Memperbarui badge counter notifikasi, avatar ring mobile, dan badge deteksi jam tidur.
- **Daftar File Diubah:**
  - `frontend/src/components/sensor/PedometerCard.tsx`
  - `frontend/src/components/pages/ActivityView.tsx`
  - `frontend/src/components/PanicReliefMode.tsx`
  - `frontend/src/components/notifications/NotificationPopover.tsx`
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/TriadDashboard.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:**
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite.
  - `npm run test:frontend` (23/23 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch `frontend`.

---

## [2026-11-25] — Pembaharuan Warna Tombol & Badge Ikon Landing Page ke Palet Hijau Sage (`LandingPage.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.83`
- **Ringkasan:**
  1. **Penyelarasan Warna Tombol Fitur Hero & Badge Ikon ke Palet Hijau Sage (`#CFD8C4`):**
     - Mengubah warna 3 pill tombol quick entry fitur di Hero Section (`Zero Continuous Camera`, `Strava Akademik (KRS)`, dan `Wellbeing AI Coach`) dari beige (`#E8DDCF`) menjadi hijau sage khas project (`bg-[#CFD8C4] hover:bg-[#BCC8AE] active:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE]`).
     - Mengubah latar belakang badge ikon kartu modul/fitur (`coursesData`) untuk ikon `BookOpen`, `Eye`, `Footprints`, dan `Bot` menjadi `bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E]`.
     - Mengubah badge ikon pada 3 Pilar Grid (`Eye`, `BookOpen`, `Bot`) serta badge logo header dan info kontak ke palet hijau sage terpadu (`bg-[#CFD8C4] border border-[#BCC8AE]`).
     - Memperbarui tombol kirim form kontak ke warna hijau sage (`bg-[#CFD8C4] hover:bg-[#BCC8AE]`) agar seluruh call-to-action dan elemen interaktif konsisten dengan panduan desain CampusFlow.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/LandingPage.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:**
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite.
  - `npm run test:frontend` (23/23 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch `frontend`.

---

## [2026-11-25] — Penghapusan Tab Switcher Masuk/Daftar pada Modal Autentikasi (`AuthModal.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.82`
- **Ringkasan:**
  1. **Penghapusan Tab Switcher Masuk/Daftar (`AuthModal.tsx`):**
     - Menghapus pill toggle tab switcher ganda ("Masuk (Login)" dan "Daftar (Register)") di bagian atas formulir modal autentikasi agar tampilan modal lebih bersih, terarah, dan tidak redundan.
     - Form yang tampil tetap terbuka secara otomatis dan presisi sesuai tombol yang ditekan pengguna di Landing Page (`initialTab`), serta tetap dapat berpindah form secara mulus melalui tautan di bagian bawah formulir ("Daftar di sini" / "Masuk di sini").
- **Daftar File Diubah:**
  - `frontend/src/components/auth/AuthModal.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:**
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite.
  - `npm run test:frontend` (23/23 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch `frontend`.

---

## [2026-11-25] — Penyempurnaan Navigasi Mobile Persis Referensi Foto 2 dengan Label Teks & Border Notch Mulus (`Navbar.tsx`, `index.css`, `App.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.81`
- **Ringkasan:**
  1. **Pemberian Keterangan Label Teks di Bawah Seluruh Tombol Navigasi (Persis Foto 2):**
     - Menambahkan teks keterangan di bawah setiap ikon: `Dashboard`, `Workstation`, `Aktivitas`, `AI Coach`, dan `Riwayat`.
     - Seluruh 5 label berbagi garis dasar (*horizontal baseline*) yang sejajar di bagian bawah navbar, dengan teks tab aktif tercetak tebal kontras tinggi (`font-extrabold text-[#2F3A2E]`).
  2. **Kerapian Garis Kontur Notch Mulus Tanpa Garis Sisa (Whiskers):**
     - Menggabungkan garis horizontal flat atas dengan lengkungan notch bergerak via SVG mask, sehingga border atas navbar menyatu 100% mulus tanpa ada garis yang keluar atau terputus.
  3. **Floating Circular Action Button Bertengger Rapi di Cekungan:**
     - Mengatur diameter dan elevasi bola hijau forest (`w-[48px] h-[48px]`) dengan ring putih presisi (`border-[2.5px] border-white`) bertengger di atas cekungan notch tanpa menabrak label teks di bawahnya maupun kartu di atasnya.
  4. **Transisi Luncuran Horizontal Murni (Geser Mulus Tanpa Loncat):**
     - Mengubah transisi navigasi mobile dari efek loncatan (*bounce/pop*) menjadi luncuran horizontal murni (*pure smooth slide*) menggunakan kurva deselerasi halus `cubic-bezier(0.25, 1, 0.5, 1)` (360ms) dengan elevasi konstan tanpa loncat vertikal, sehingga perpindahan antar tab terasa tenang, elegan, dan mulus.
- **Daftar File Diubah:**
  - `frontend/src/index.css`
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/App.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:**
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite.
  - `npm run test:frontend` (23/23 lolos).
  - `npm run test:shared` (5/5 lolos).
  - `npm run guard` lolos validasi zona branch `frontend`.

---

## [2026-11-24] — Penyelarasan Warna Tubuh Mascot Pet Tingkat Legenda ke Pastel Pink (`mimiSvg.ts`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.80`
- **Ringkasan:**
  1. **Penyelarasan Warna Tubuh Mascot Mimi Edisi Legenda (`mimiSvg.ts`):**
     - Mengubah warna tubuh (`BODY`) mascot Mimi pada tingkat evolusi tertinggi (Level 5 Legenda, 100 hari streak) dari nuansa krem/beige pucat (`#E7DCCF`) menjadi pastel pink konsisten (`#F2D3D1`), persis seperti pada tingkat Tunas/Kuncup/Mekar.
     - Memastikan seluruh aksesoris khusus Legenda (mahkota emas, pelangi/halo aura, bintang-bintang, dan bunga mekar di kepala) tetap utuh dan kontras berpadu dengan tubuh pastel pink.
- **Daftar File Diubah:**
  - `frontend/src/components/pet/mimiSvg.ts`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:**
  - `npm --prefix frontend run build` lolos dengan 0 error.
  - `npm run test:frontend` (23/23 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-24] — Penyesuaian Label Milestone Peta Rute Pedometer Menjadi Estimasi Kalori Terbakar (`PedometerCard.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.79`
- **Ringkasan:**
  1. **Pengubahan Label Milestone Rute Langkah Menjadi Estimasi Kalori Terbakar:**
     - Mengubah teks di bawah angka target langkah pada peta rute ilustrasi kampus (`PedometerCard.tsx`) dari label nama tempat kampus (`Gerbang Utama`, `Koridor Akademik`, `Lingkar Luar`, `Target Sehat`) menjadi nilai estimasi kalori yang terbakar:
       - `500` langkah &rarr; `20 kkal`
       - `1.500` langkah &rarr; `60 kkal`
       - `3.000` langkah &rarr; `120 kkal`
       - `6.000` langkah &rarr; `240 kkal`
     - Menambahkan atribut tooltip penjelas pada setiap badge milestone (`${milestone.steps} langkah • Estimasi ${milestone.calories} kkal terbakar`).
     - Memperbarui sub-judul kartu menjadi "Berjalan di kampus, pantau langkah dan kalori yang terbakar hari ini." agar lebih selaras dengan metrik kalori.
- **Daftar File Diubah:**
  - `frontend/src/components/sensor/PedometerCard.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:**
  - `npm --prefix frontend run build` lolos tanpa error.
  - `npm run test:frontend` (23/23 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-24] — Penyempurnaan UI Dashboard, Workstation, Vision Guard, Pedometer Rute Kampus & Perbaikan MediaPipe/OS Lock Windows (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.78`
- **Ringkasan:**
  1. **Penyempurnaan UI Dashboard & Navigasi (`App.tsx`, `Navbar.tsx`, `TriadDashboard.tsx`):**
     - Merapikan bar **Proteksi Screen Time Level OS** menjadi satu baris horizontal sejajar dengan tombol pill (`rounded-full`).
     - Memperbarui kartu hero **Burnout Risk Index** bernuansa Soft Sage pastel dengan gelombang halus dan indikator status warna langsung pada lingkaran indeks (hijau = aman, kuning/amber = waspada, merah = risiko tinggi).
     - Mendesain ulang 4 kartu metrik (`Beban Kuliah`, `Waktu Layar`, `Tidur Semalam`, `Active Break`) menjadi permukaan krem cerah `#FDFBF8` dengan kotak ikon Soft Sage dan ornamen cincin konsentris halus, serta menambahkan ikon buku pada pill **Beban Kognitif**.
     - Menghapus sublabel & badge berlebihan (`Sensor Layar OS`, `Auto Inaktivitas Malam`, durasi HMS, badge tidur), meratakan legenda grafik ke kiri dengan warna tegas, dan membuat tombol menu sidebar lebih kotak (`rounded-xl`).
  2. **Desain Ulang Workstation Belajar & Jeda (`FocusView.tsx`):**
     - Menyegarkan kartu fokus bernuansa Soft Sage dengan piringan timer melingkar, titik indikator progres, preset durasi pill, kontrol sesi, progres titik harian, serta kartu **Suara Ambience Belajar** berikon vektor.
  3. **Perbaikan & Desain Ulang Layar Kunci Vision Guard (`VisionGuard.tsx`, `frontend/public/wasm/`, `frontend/public/models/`):**
     - Memasang aset WASM & model lokal `pose_landmarker_lite.task`, menambahkan validasi aset non-HTML dengan fallback CDN & GPU/CPU, memperbaiki timestamp monoton `detectForVideo`, melonggarkan constraint FPS kamera, serta mengamankan cleanup React `StrictMode`.
     - Mendesain ulang layar kunci peregangan ke tema Soft Sage–Ivory yang tenang dengan viewfinder kamera, ring timer hold melingkar, dan panduan repetisi peregangan.
  4. **Peta Rute Kampus & Pencatat Cepat Aktivitas (`PedometerCard.tsx`, `ActivityView.tsx`):**
     - Menambahkan ilustrasi lanskap rute kampus interaktif (`500 Gerbang Utama` → `6.000 Target Sehat`) dengan pin jejak kaki bergerak, menempatkannya di bagian paling atas halaman Aktivitas diikuti strip konsistensi 7 hari dan kartu **Pencatat Cepat Aktivitas Fisik** berindikator intensitas.
  5. **Perbaikan Fokus OS Screen Lock di Windows (`backend/src/services/osLockService.ts`):**
     - Memfilter target fokus jendela Windows khusus proses peramban asli (`msedge`, `chrome`, `brave`, `firefox`, `vivaldi`, `opera`, `arc`) agar OS Lock tidak salah menarik fokus ke jendela IDE (`CampusFlow — Antigravity IDE`).
- **Daftar File Diubah:**
  - `frontend/src/App.tsx`
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/TriadDashboard.tsx`
  - `frontend/src/components/pages/FocusView.tsx`
  - `frontend/src/components/pages/ActivityView.tsx`
  - `frontend/src/components/sensor/PedometerCard.tsx`
  - `frontend/src/components/vision/VisionGuard.tsx`
  - `frontend/public/wasm/*` & `frontend/public/models/pose_landmarker_lite.task`
  - `frontend/index.html` & `frontend/vite.config.ts`
  - `backend/src/services/osLockService.ts`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Catatan Cross-Scope:**
  - `[CROSS-SCOPE] backend/src/services/osLockService.ts` — Memperbaiki fungsi `enforceWindowsFocus()` yang sebelumnya memanggil `AppActivate('CampusFlow')` sehingga keliru mengunci fokus ke jendela IDE (judul mengandung `CampusFlow`) alih-alih jendela browser saat pengujian Vision Guard di Windows.
- **Verifikasi:**
  - `npm --prefix frontend run build` (`tsc && vite build`) lolos dengan 0 error.
  - `npm --prefix frontend test` lulus 23/23 test.
  - `npm --prefix backend run typecheck` lolos dengan 0 error.
  - `npm run guard` lolos validasi zona branch & changelog.

---

## [2026-11-24] — Penghapusan Duplikasi Profil Sidebar & Pemerataan Lebar Layout Halaman (`Navbar.tsx` & 8 Views) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.77`
- **Ringkasan:**
  1. **Penghapusan Kartu Profil Duplikat di `DesktopSidebar` (`Navbar.tsx`):**
     - Menghapus blok profil pengguna (*avatar M + nama + Mahasiswa Aktif + Edit →*) pada bagian bawah sidebar kiri karena akses profil sudah tersedia melalui tombol ikon profil di pojok kanan atas header (`DesktopTopHeader`), menyisakan tombol **Log out** agar navigasi bersih dan tidak ganda.
  2. **Pemerataan Lebar Layout Konten (`w-full`) di Bawah Bar Proteksi Screen Time Level OS:**
     - Mengubah pembungkus konten seluruh halaman (`ActivityView`, `CheckinView`, `FocusView`, `HistoryView`, `ProfileView`, `SettingsView`, `VisionLabView`, `CoachView`) dari batas lebar sempit terpusat (`max-w-2xl/3xl/4xl/5xl/6xl mx-auto`) menjadi `w-full` agar sejajar kiri-kanan secara simetris mengikuti lebar bar **Proteksi Screen Time Level OS**.
- **Daftar File Diubah:**
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/pages/ActivityView.tsx`
  - `frontend/src/components/pages/CheckinView.tsx`
  - `frontend/src/components/pages/CoachView.tsx`
  - `frontend/src/components/pages/FocusView.tsx`
  - `frontend/src/components/pages/HistoryView.tsx`
  - `frontend/src/components/pages/ProfileView.tsx`
  - `frontend/src/components/pages/SettingsView.tsx`
  - `frontend/src/components/pages/VisionLabView.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:**
  - `npm --prefix frontend run build` (`tsc && vite build`) lolos tanpa error (2203 modul).
  - `npm run guard` lolos validasi zona branch & changelog.

---

## [2026-11-17] — Pengayaan Fitur Workstation & Jeda (`FocusView.tsx`) dan Aktivitas & Check-in (`ActivityView.tsx`, `PedometerCard.tsx`, `CheckinView.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.76`
- **Ringkasan:** 
  1. **Pengayaan Halaman Workstation & Jeda (`FocusView.tsx`):**
     - **Target Tugas Sesi Ini (*Focus Tasks Checklist*):** Menambahkan manajemen tugas belajar dengan input tugas baru, tag kategori (Tugas, Praktikum, Ujian, Skripsi), checklist penyelesaian, dan indikator target aktif di atas timer Pomodoro.
     - **Generator Suara Ambience Belajar (*Study Soundscapes*):** Mengintegrasikan synthesizer audio Web Audio API bawaan peramban (100% offline tanpa unduhan aset eksternal) dengan 4 opsi suara relaksasi fokus (*Hujan Tenang*, *Gelombang Alpha 432Hz*, *White Noise*, dan *Kafe Kampus*), kontrol volume slider, dan animasi gelombang audio visual.
     - **Widget Ergonomi & Aturan 20-20-20 (*Eye Rest & Posture Guide*):** Menyediakan pengingat interaktif aturan 20-20-20 dengan modal hitung mundur jeda mata 20 detik serta checklist panduan postur duduk sehat (layar sejajar mata, bahu rileks, kaki stabil).
     - **Garis Waktu Sesi Fokus Hari Ini (*Focus Timeline Bar*):** Menampilkan rekapitulasi riwayat sesi Pomodoro yang telah diselesaikan sepanjang hari ini beserta durasi dan topiknya.
  2. **Pengayaan Halaman Aktivitas & Check-in (`ActivityView.tsx`, `PedometerCard.tsx`, `CheckinView.tsx`):**
     - **Kalender Strip Konsistensi 7 Hari (`ActivityView.tsx`):** Menampilkan baris status check-in harian (Senin–Minggu) dengan badge streak "5 Hari Streak Konsisten" yang terhubung dengan maskot Mimi.
     - **Milestone Rute Kampus (`PedometerCard.tsx`):** Menghubungkan akumulasi langkah kaki mahasiswa ke rute nyata kampus (Halte Gerbang Utama, Perpustakaan, Danau Rektorat, hingga Target Harian 6.000 Langkah WHO/IPAQ-SF) dilengkapi estimasi kalori (kkal) dan jarak tempuh (km).
     - **Pencatat Cepat Aktivitas Fisik Kampus (`PedometerCard.tsx`):** Menambahkan tombol pintas pencatatan aktivitas non-jalan kaki (Naik Tangga Kampus 5 mnt, Bersepeda 15 mnt, Olahraga Sore 30 mnt) yang langsung menambahkan MET-menit dan ekuivalen langkah.
     - **Pratinjau Kebugaran & Pemulihan Instan (`CheckinView.tsx`):** Menambahkan kartu evaluasi live di atas tombol submit check-in yang langsung menghitung proyeksi skor pemulihan tidur, beban layar, dan tingkat stres sebelum formulir dikirim.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/FocusView.tsx`
  - `frontend/src/components/pages/ActivityView.tsx`
  - `frontend/src/components/sensor/PedometerCard.tsx`
  - `frontend/src/components/pages/CheckinView.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite (2199 modul ter-compile).
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Perapian Komposisi Visual Banner Hero & Integrasi Kapsul Kontrol Waktu/Suasana (`TriadDashboard.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.75`
- **Ringkasan:** 
  1. **Penyatuan Widget Jam, Tanggal, & Mode Suasana dalam Satu Kapsul (*Unified Control Capsule*):**
     - Menggabungkan badge jam digital, tanggal kalender, dan tombol ganti mode Siang/Malam yang sebelumnya terpisah menjadi satu kapsul kontrol tunggal (*single sleek pill*) di sudut kanan atas banner hero.
     - Menghapus label teks tambahan `(Ganti)` dan menggantikannya dengan tombol chip interaktif yang proporsional dan bersih (`☀️ Siang` / `🌙 Malam`).
  2. **Pemberian Ruang Lapang (*Breathing Room*) Ilustrasi Langit & Awan:**
     - Menurunkan wadah ilustrasi benda langit ke bagian bawah kartu hero (`bottom-0 sm:bottom-1` dengan tinggi `h-32 sm:h-36`) sehingga posisi matahari dan bulan sabit tidak lagi bertabrakan atau terhimpit tepat di bawah badge jam.
     - Menghaluskan lintasan gerak keliling (*orbital stroll*) agar tetap berada dalam ruang terbuka yang lapang di atas awan, menciptakan kesan visual yang harmonis, rapi, dan seimbang.
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite (2199 modul ter-compile).
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Penghapusan Panah Stepper / Spinner Browser pada Input Jam Check-in (`index.css` & `CheckinView.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.74`
- **Ringkasan:** 
  1. **Penghapusan Panah Spinner Bawaan Browser (`index.css` & `CheckinView.tsx`):**
     - Menghilangkan simbol tombol panah atas/bawah (*number input spin button steppers* `▲`/`▼`) bawaan browser pada input durasi tidur dan jam layar hiburan.
     - Menerapkan aturan CSS `-webkit-appearance: none` pada `::-webkit-inner-spin-button` dan `::-webkit-outer-spin-button` serta `-moz-appearance: textfield` / `appearance: textfield` di level global (`index.css`) dan utilitas Tailwind di [CheckinView.tsx](file:///c:/Users/HP%20VICTUS/Downloads/CampusFlow/frontend/src/components/pages/CheckinView.tsx).
     - Menghasilkan tampilan input angka yang bersih, rapi, dan konsisten tanpa tombol panah yang mengganggu.
- **Daftar File Diubah:**
  - `frontend/src/index.css`
  - `frontend/src/components/pages/CheckinView.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite (2199 modul ter-compile).
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Input Ketik Interaktif Jam Tidur & Layar serta Penyesuaian Skala 1–5 Kuisioner Stres PSS-4 (`CheckinView.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.73`
- **Ringkasan:** 
  1. **Input Interaktif Durasi Tidur & Layar Hiburan (`CheckinView.tsx`):**
     - Mengubah indikator teks statis durasi tidur ("7 Jam") dan durasi layar non-akademik ("4 Jam") menjadi kotak input angka (`<input type="number">`) modern dengan aksen Fresh Pastel yang dapat diketik langsung oleh pengguna.
     - Melakukan sinkronisasi dua arah (*two-way binding*) antara input ketik dengan slider bar, sehingga perubahan nilai dari ketikan angka langsung menggeser posisi slider dan sebaliknya.
  2. **Penyesuaian Skala Kuisioner Stres PSS-4 (`CheckinView.tsx`):**
     - Mengubah nilai tombol skala evaluasi stres dari `0, 1, 2, 3, 4` menjadi `1, 2, 3, 4, 5` agar lebih intuitif bagi mahasiswa.
     - Memperbarui sub-label header kuisioner menjadi `Skala 1 (Tidak Pernah) – 5 (Sangat Sering)`.
     - Mengadaptasi pemetaan payload API secara presisi (`(val - 1)`) agar tetap mematuhi skema validasi backend Likert standar PSS-4 (0–4) tanpa menimbulkan galat validasi.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/CheckinView.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite (2199 modul ter-compile).
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Pembersihan Label "Strava" & Subtitle "Academic Strava" pada Navigasi dan Header (`Navbar.tsx` & `TriadDashboard.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.72`
- **Ringkasan:** 
  1. **Pembersihan Label Tab Navigasi (`Navbar.tsx`):**
     - Mengubah label menu pertama `Dashboard Strava` menjadi `Dashboard` yang lebih bersih dan ringkas.
  2. **Penghapusan Subtitle Brand Header Sidebar (`Navbar.tsx`):**
     - Menghapus teks sub-judul `Academic Strava` di bawah nama brand `CampusFlow` pada sidebar desktop, menciptakan tampilan brand yang lebih minimalis dan fokus.
  3. **Penyesuaian Kategori Banner Hero (`TriadDashboard.tsx`):**
     - Memperbarui sub-label banner dari `Dashboard Strava Akademik` menjadi `Dashboard Akademik`.
- **Daftar File Diubah:**
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/TriadDashboard.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite (2199 modul ter-compile).
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Penambahan Jam Digital Real-Time & Tanggal Kalender pada Banner Hero (`TriadDashboard.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.71`
- **Ringkasan:** 
  1. **Integrasi Widget Jam Digital Real-Time (*Live Ticking Digital Clock*):**
     - Membangun timer interval 1 detik untuk menyajikan waktu lokal terkini secara presisi (`HH:mm:ss`).
     - Menggunakan tipografi `font-mono tabular-nums tracking-tight` untuk mencegah pergeseran tata letak (*layout shift*) saat detik berganti.
  2. **Integrasi Tanggal Kalender Indonesia Lengkap (*Localized Calendar Date Badge*):**
     - Menampilkan nama hari, tanggal, nama bulan, dan tahun (misal: `Selasa, 17 Nov 2026`) yang disandingkan harmonis dengan ikon kalender Lucide.
     - Dibalut dalam wadah pil kaca modern (*glassmorphic pill* `bg-white/85 backdrop-blur-md shadow-2xs`) di sisi kanan atas banner hero di samping tombol mode cuaca Siang/Malam, responsif dan adaptif terhadap layar desktop maupun mobile.
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite (2199 modul ter-compile).
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Peningkatan Animasi Halus: Orbit Jalan-Jalan Pelan Matahari/Bulan & Integrasi 2 Awan Berlapis (`TriadDashboard.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.70`
- **Ringkasan:** 
  1. **Animasi Berkeliling / Jalan-Jalan Santai (*Celestial Orbital Stroll*):**
     - Mengembangkan animasi orbit melayang organik berkecepatan santai (`celestialOrbitalStroll 15s ease-in-out infinite`) di mana Matahari (Siang) dan Rembulan (Malam) bergerak perlahan berkeliling di langit atas dalam lintasan elips yang lembut, santai, dan tidak kaku.
     - Dipadukan dengan putaran sinar ambient perlahan (45s) dan denyut aura napas lembut (4s) yang menenangkan saraf mata mahasiswa.
  2. **Integrasi 2 Formasi Awan Organik HD (*Dual Layered Clouds*):**
     - Menghadirkan 2 awan terpisah yang saling melengkapi di bawah lintasan matahari/bulan:
       - **Awan 1 (Awan Utama di Kiri Bawah):** Formasi awan tebal dengan animasi melayang lembut 10s (`driftCloud1`).
       - **Awan 2 (Awan Pendamping di Kanan Bawah):** Formasi awan berdimensi dengan offset kedalaman dan animasi melayang 12s (`driftCloud2`).
     - Kedua awan bergerak berlawanan fase secara halus di bawah matahari/bulan, menciptakan pemandangan langit berlapis (*depth of field*) yang hidup dan elegan.
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite (2199 modul ter-compile).
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Penguncian Komposisi Simetris: Awan Tepat di Bawah Matahari (Siang) dan Tepat di Bawah Bulan (Malam) (`TriadDashboard.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.69`
- **Ringkasan:** 
  1. **Penyelarasan Vertikal Satu Sumbu Simetri (*Coaxial Vertical Alignment*):**
     - Mengubah arsitektur kontainer ilustrasi menjadi kotak tetap kanan (`w-48 sm:w-56 h-36 sm:h-40`, vertikal terpusat di sisi kanan kartu) dengan kanvas SVG proporsional `220 x 160`.
     - Mengunci sumbu horizontal pusat di satu garis yang sama (`X = 110`), sehingga awan tidak bergeser atau terpisah ke samping kiri/kanan.
     - **Mode Siang:** Matahari berada di atas (`X = 110, Y = 52`) dan gumpalan awan HD berada tepat tegak lurus di bawahnya (`X = 110, Y = 114`).
     - **Mode Malam:** Rembulan sabit berada di atas (`X = 110, Y = 50`) dan gumpalan awan malam HD berada tepat tegak lurus di bawahnya (`X = 110, Y = 114`).
  2. **Animasi Mengapung Stabil & Efek HD:**
     - Menerapkan animasi melayang lembut terpusat (`cloudUnderSun` dan `celestialFloatSlow`) yang menjaga awan tetap berada persis sebagai bantalan empuk di bawah matahari/bulan tanpa melayang ke tepi kartu.
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite (2199 modul ter-compile).
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Peningkatan Visual HD Ilustrasi Langit & Reposisi Awan di Bawah Matahari / Rembulan (`TriadDashboard.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.68`
- **Ringkasan:** 
  1. **Reposisi Sempurna Awan di Bawah Matahari dan Rembulan (*Beneath-the-Sun/Moon Horizon Layering*):**
     - Memposisikan Matahari dan Rembulan anggun di langit bagian atas (`cx = 280, cy = 58`) dengan jarak lega dari tombol toggle suasana.
     - Menyusun formasi gumpalan awan berlapis (*layered cloud bank*) berada secara tegas di bawah matahari dan rembulan (`y = 112 - 180`), menciptakan komposisi horizon pemandangan langit yang megah dan natural di mana matahari/bulan bersinar menyinari hamparan awan di bawahnya.
  2. **Peningkatan Kualitas Visual Vektor HD (*High-Definition Detailing*):**
     - Menambahkan filter bayangan lembut vektor hardware-accelerated (`filter="url(#hdCloudShadow)"`) untuk kedalaman 3D awan yang padat, tanggap, dan bervolume (*plush fluffy clouds*).
     - Menambahkan filter pendaran cahaya (*glow filter*) pada Matahari dan Rembulan (`#hdSunGlow` dan `#hdMoonGlow`) serta kilau pantulan spekular 3D (*specular glint*) dan cincin interior tipis pada bola matahari.
     - Menambahkan kilau garis tepi (*top edge highlight*) pada puncak awan untuk estetika HD modern yang tajam dan tidak buram.
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite (2199 modul ter-compile).
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Implementasi Pola Interaktif Langit Sirkadian (Matahari & Awan Pagi/Siang vs Rembulan & Bintang Malam) pada Hero Card (`TriadDashboard.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.67`
- **Ringkasan:** 
  1. **Integrasi Pola Langit Dinamis Waktu Riil (*Dynamic Circadian Sky Theme*):**
     - Mengubah aksen ornamen visual sisi kanan banner *Burnout Risk Index* menjadi ilustrasi langit dinamis yang berganti otomatis sesuai jam lokal mahasiswa (`06:00 - 18:00 = Siang`, selebihnya `Malam`).
     - **Mode Pagi / Siang (Semangat & Produktivitas):** Menampilkan Matahari pastel hangat (`#FFF29A` & `#FFD97D`) dengan pendaran aura (*glowing corona*) dan sinar berputar halus 36s, ditemani awan putih-sky berarak lembut di depan dan belakang matahari untuk efek kedalaman 3D (*parallax drifting clouds*).
     - **Mode Malam (Restorasi & Pemulihan Tidur):** Menampilkan Rembulan sabit anggun (*luminous crescent moon*) berpendar lembut, dikelilingi 5 bintang mikro berkelip (*twinkling sparkle stars*), serta awan malam bernuansa pastel lavender-sky yang menenangkan sistem saraf.
  2. **Interaktivitas Penuh & Animasi Organik (*Motion & Interaction*):**
     - Dilengkapi gerakan melayang vertikal halus (*celestialFloatSlow*, 5s), pendaran napas aura (*celestialPulse*), dan pergeseran awan horizontal (*cloudDriftA/B*), serta mematuhi aksesibilitas `prefers-reduced-motion`.
     - Menyediakan tombol *pill badge* interaktif di pojok kanan atas banner (`☀️ Pagi / Siang` / `🌙 Malam`) sekaligus area klik pada seluruh ilustrasi langit yang memungkinkan pengguna beralih suasana kapan saja dengan responsif.
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite (2199 modul ter-compile).
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Implementasi Ornamen Batik Kawung Transparan Modern pada Hero Card Burnout Index (`TriadDashboard.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.66`
- **Ringkasan:** 
  1. **Integrasi Motif Batik Kawung Keseimbangan Modern (*Modern Translucent Batik Kawung*):**
     - Mengembangkan ornamen geometris SVG berbasis filosofi Nusantara **Batik Kawung** yang disederhanakan secara elegan (*minimalist & clutter-free*) tanpa garis kontur/stroke tajam.
     - Menyusun mandala Kawung 4 kelopak elips transparan (*Sedulur Papat Limo Pancer*) yang merefleksikan 4 pilar keseimbangan gaya hidup mahasiswa: (1) Beban Akademik / SKS, (2) Gerak Fisik & Strava, (3) Tidur & Pemulihan Restoratif, serta (4) Ketenangan Mental & Waktu Layar.
     - Menempatkan titik harmoni pusat (*Limo Pancer* / Titik Nol Burnout) yang melambangkan kondisi *flow state* mahasiswa dalam zona aman.
     - Melengkapi motif dengan mandala sekunder interlocking lembut yang melarut (*fading out*) ke arah kiri sehingga tidak mengganggu keterbacaan teks utama (WCAG AA).
     - Menggunakan gradasi Fresh Pastel Health resmi CampusFlow (Mint `#CDE8B5`, Butter `#FFF29A`, Sky Blue `#BDE6F0`, dan Soft Pink `#F7A8B0`) dengan opasitas tembus pandang lembut (15% s/d 45%).
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite (2199 modul ter-compile).
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Penyederhanaan Pola Abstrak Banner Burnout Index: Penghapusan Garis Kontur & Vektor (`TriadDashboard.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.65`
- **Ringkasan:** 
  1. **Pembersihan Garis dan Ornamen Vektor dari Pola Grafis Hero Card:**
     - Menghapus seluruh elemen garis kontur kurva (*flowing contour lines*), garis putus-putus (*dashed lines*), lingkaran orbit konsentris (*orbit rings*), micro-sparkles, dan dot grid halus dari ornamen SVG banner Hero *Burnout Risk Index*.
     - Mempertahankan 3 lapisan bentuk gelombang organik transparan (*soft translucent organic wave shapes*) dengan paduan gradasi pastel khas CampusFlow (Mint, Butter, Sky Blue, dan Soft Pink) yang tampil lebih bersih, tenang (*clean & distraction-free*), dan menyatu mulus dengan latar kartu tanpa mengganggu fokus informasi utama.
  2. **Pembersihan Komponen Doodle Latar Belakang Global:**
     - Menghapus komponen `BackgroundDoodles.tsx` dan integrasinya di `App.tsx` sesuai preferensi pengguna agar tampilan ruang kerja aplikasi tetap minimalis, tenang, dan bersih.
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `frontend/src/App.tsx`
  - `frontend/src/components/common/BackgroundDoodles.tsx` (dihapus)
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Penambahan Doodle Latar Belakang Seluruh Halaman Aplikasi Terautentikasi (`BackgroundDoodles.tsx` & `App.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.64`
- **Ringkasan:** 
  1. **Pembuatan Komponen Vektor Doodle Halus (`BackgroundDoodles.tsx`):**
     - Membangun pola doodle SVG seamless (`campusflow-academic-doodles`, 420x420 tile) bertema akademik mahasiswa, aktivitas fisik (Academic Strava), dan kesehatan mental (Fresh Pastel).
     - Berisi 17 elemen doodle hand-drawn: buku kuliah terbuka, tunas Mimi (wellbeing), cangkir kopi/teh hangat jeda istirahat, sepatu sneaker langkah kaki, pensil dan coretan gelombang, awan tidur pulas dengan Zzz, tetesan air hidrasi sehat, hati dengan garis pulse detak jantung, stopwatch pomodoro timer, topi toga wisuda, petir energi fokus, bola lampu ide eureka, bunga daisy pastel, sticky note checklist, mata ergonomis Vision Lab, serta ornamen mikro bintang sparkle, spiral, dan dot cluster halus.
     - Menggunakan outline stroke gelap transparan (`#1A1A1A`, opasitas 5.5%) dan sentuhan warna isi pastel lembut (Mint `#CDE8B5`, Butter `#FFF29A`, Sky Blue `#BDE6F0`, Soft Pink `#F7A8B0`, dan Sparkle Gold `#FFD97D` dengan opasitas 18% - 35%).
     - Didesain non-intrusif (`fixed inset-0 pointer-events-none select-none z-0 overflow-hidden`) yang tidak mengganggu klik, seleksi, maupun keterbacaan kartu di atasnya (WCAG AA).
  2. **Penerapan Eksklusif pada Halaman Aplikasi Terautentikasi (`App.tsx`):**
     - Diletakkan di dalam container shell utama aplikasi setelah login, sehingga aktif secara merata di seluruh tab: Dashboard, Workstation & Jeda, Aktivitas & Check-in, AI Coach, Riwayat, Pengaturan, dan Profil Mahasiswa.
     - Secara tegas dikecualikan dari Landing Page, Login, maupun Register modal karena `LandingPage` dirender dalam conditional branch terpisah sebelum shell aplikasi.
- **Daftar File Diubah:**
  - `frontend/src/components/common/BackgroundDoodles.tsx` (baru)
  - `frontend/src/App.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite (2200 modul ter-compile).
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Penambahan Pola Abstrak Transparan pada Banner Hero Burnout Index (`TriadDashboard.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.63`
- **Ringkasan:** 
  1. **Integrasi Pola Grafis Abstrak Semi-Transparan (*Vitality Flow Graphic Pattern*):**
     - Menambahkan ornamen grafis SVG abstrak elegan semi-transparan pada sisi kanan kartu banner *Burnout Risk Index* yang sebelumnya kosong.
     - Menggunakan 3 lapisan gelombang organik gradasi pastel khas CampusFlow (Mint `#CDE8B5`, Butter `#FFF29A`, Sky Blue `#BDE6F0`, dan Soft Pink `#F7A8B0`) dengan opasitas lembut (10% s/d 45%) yang berpadu dinamis dengan status risiko.
     - Dilengkapi garis kontur dinamis (*flow curves* & *dashed lines*), orbit cincin konsentris halus, micro-sparkles, dan dot grid minimalis yang merefleksikan konsep aliran vitalitas dan ritme hidup seimbang.
     - Penempatan absolut aman (`absolute right-0 top-0 bottom-0 pointer-events-none select-none overflow-hidden`) dengan z-index konten di `relative z-10`, sehingga tidak mengganggu interaksi dan mempertahankan keterbacaan teks utama secara optimal (WCAG AA).
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Pembersihan Skala Cadence & Tombol Simulasi Langkah (`PedometerCard.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.62`
- **Ringkasan:** 
  1. **Penghilangan Panduan Rentang Cadence (*Cadence Range Scale Guide*):**
     - Menghapus kotak panduan tingkat kecepatan langkah (`Tingkat Kecepatan Langkah: 0 Langkah/Menit Saat Ini` beserta 4 box rentang SPM: `<50 SPM`, `50-99 SPM`, `100-129 SPM`, dan `≥130 SPM`) untuk tampilan pedometer yang lebih ringkas dan bersih.
  2. **Penghilangan Tombol Simulasi Langkah Manual:**
     - Menghapus tombol desktop simulasi `+ 1 Langkah` dan `⚡ +10 Langkah` dari bilah aksi kartu pedometer, menjaga antarmuka tetap bersih dan berfokus pada deteksi sensor gerak otomatis asli perangkat (*DeviceMotionEvent*).
     - Membersihkan fungsi `handleSimulateStep` dan unused imports (`Plus`, `Zap`) agar kompilasi TypeScript tetap optimal.
- **Daftar File Diubah:**
  - `frontend/src/components/sensor/PedometerCard.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Redesain Floating Streak Pet Tanpa Stroke Kotak & Pembesaran Avatar Pet (`MimiPetWidget.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.61`
- **Ringkasan:** 
  1. **Penghilangan Garis Stroke (*No-Stroke Container*):**
     - Menghapus kotak pembungkus kapsul yang memiliki stroke tebal (`border-2 border-[#1A1A1A]`, `bg-white/95`) dan garis drag handle di bagian atas.
     - Menghapus stroke garis hitam pada badge runtunan hari streak (`border-2 border-[#1A1A1A]`).
  2. **Pembesaran Avatar Pet Mimi Sebagai Ikon Utama:**
     - Memperbesar ukuran animasi avatar Mimi dari `w-14 h-14` menjadi `w-20 h-20 sm:w-22 sm:h-22` dengan efek bayangan halus (*drop-shadow-md*), sehingga pet Mimi langsung menjadi ikon visual streak yang ekspresif dan hidup.
  3. **Penataan Runtunan Streak di Bawah Avatar Pet:**
     - Menampilkan indikator streak tepat di bawah pet Mimi dengan pill lembut pastel kuning tanpa garis stroke (`bg-[#FFF29A] text-[#1A1A1A] px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-xs`).
     - Menampilkan teks runtunan hari yang jelas: `🔥 {streak} Hari`.
- **Daftar File Diubah:**
  - `frontend/src/components/pet/MimiPetWidget.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Penghilangan Baris Footer Landing Page (`LandingPage.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.60`
- **Ringkasan:** 
  1. **Penghilangan Footer Bawah Landing Page:**
     - Menghapus elemen baris `<footer ...>` di bagian paling bawah Landing Page (termasuk logo CampusFlow, teks hak cipta `© 2026 Academic Strava & Predictive Wellbeing`, serta tombol `Masuk (Login)` dan `Daftar Akun Baru`).
     - Halaman landing kini berakhir secara rapi langsung setelah seksi penutup fitur & FAQ tanpa footer ganda yang repetitif.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/LandingPage.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Penghilangan Tombol CTA Register & Login pada Hero Section Landing Page (`LandingPage.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.59`
- **Ringkasan:** 
  1. **Penghilangan Tombol CTA Hero Section:**
     - Menghapus kontainer tombol aksi CTA hero section (`Daftar Akun Mahasiswa (Register)` dan `Masuk ke Akun (Login)`) pada kolom kiri landing page untuk tampilan hero yang lebih minimalis dan berfokus pada ringkasan fitur utama.
     - Akses masuk dan registrasi akun mahasiswa tetap tersedia secara intuitif melalui tombol navbar kanan atas (*Masuk* & *Daftar Akun*), menu navigasi drawer mobile, dan seksi ajakan akhir di bagian bawah halaman (*Bottom CTA*).
- **Daftar File Diubah:**
  - `frontend/src/components/pages/LandingPage.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript/Vite.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Pembersihan & Penghapusan Sub-elemen/Label yang Tidak Diperlukan (`FocusView.tsx`, `TriadDashboard.tsx`, `MimiPetWidget.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.58`
- **Ringkasan:** 
  1. **Penghilangan Subteks & Badge Footer pada 3 Kartu Fokus (`FocusView.tsx`):**
     - Menghapus baris bawah footer ("Akumulasi fokus [Hari ini]", "Sesi tercapai [Aktif]", "Tercatat aktif [Tercatat]") dari ketiga kartu ritme fokus untuk tampilan metrik yang lebih bersih dan lapang.
  2. **Penghilangan Subteks Footer pada 4 Kartu Parameter Dashboard (`TriadDashboard.tsx`):**
     - Menghapus baris info footer ("1 Kuliah Hari Ini", "Total waktu layar terdeteksi", "Total jam tidur user terdata", "+10 Poin Pemulihan") sehingga kartu fokus menampilkan ikon, judul, nilai metrik, dan satuan secara seragam.
  3. **Penghilangan Deskripsi Subjudul Jadwal Kuliah (`TriadDashboard.tsx`):**
     - Menghapus teks deskripsi "Daftar mata kuliah aktif dan estimasi beban kognitif" di bawah judul "Jadwal Kuliah Hari Ini".
  4. **Penyederhanaan Baris Item Jadwal Kuliah (`TriadDashboard.tsx`):**
     - Menghapus badge jenis kuliah ("Praktikum (1.5x) / Teori (1.0x)") dan nilai beban poin per baris ("4.5 Poin"), menyisakan kotak SKS, nama matakuliah, dan tombol aksi hapus.
  5. **Penghilangan Teks Panduan Pet Mimi (`MimiPetWidget.tsx`):**
     - Menghapus baris panduan "Ketuk Mimi untuk menyapa & lihat reaksinya! • Ganti Nama" dari bawah avatar pet.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/FocusView.tsx`
  - `frontend/src/components/TriadDashboard.tsx`
  - `frontend/src/components/pet/MimiPetWidget.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Perapian & Penyelarasan Layout Card Dashboard Strava (`TriadDashboard.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.57`
- **Ringkasan:** 
  1. **Penyelarasan Tinggi & Struktur Dua Kolom Utama (*Equal Card Heights*):**
     - Mengubah grid section utama dua kolom (`lg:grid-cols-12`) dengan `items-stretch` serta container flexbox `flex flex-col` dan `h-full flex flex-col justify-between`.
     - Memperbaiki kartu *"Jadwal Kuliah Hari Ini"* (`lg:col-span-7`) dan kartu *"Tren Burnout & Pemulihan 14 Hari"* (`lg:col-span-5`) agar memiliki tinggi yang seragam (*equal height*), menghilangkan rongga kosong (*blank gap*) di bawah kartu jadwal.
     - Menyematkan garis pembatas footer (`border-t border-[#E8E8E8] mt-4 pt-3`) di kedua kartu pada baseline horizontal yang sejajar sempurna.
     - Menyamakan hierarki tipografi header kedua kartu menjadi `text-base font-heading font-extrabold text-[#1A1A1A]` dengan subjudul pendukung `text-[11px] text-[#9A9A9A]`.
  2. **Harmonisasi Empat Kartu Parameter Inti (*4 Core Parameter Metric Cards*):**
     - Memastikan seluruh kartu memiliki tinggi yang sama (`h-full flex flex-col justify-between`) dan padding konsisten (`p-4 sm:p-5`).
     - Menyeragamkan kapitalisasi judul (*Title Case*): *"Beban Kuliah"*, *"Waktu Layar"*, *"Tidur Semalam"*, *"Active Break"*.
     - Menyelaraskan tipografi subteks/footer pada kartu Active Break menjadi abu-abu netral terstruktur (`text-[11px] text-[#9A9A9A] font-medium`) agar konsisten dengan tiga kartu lainnya.
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Penambahan Fitur Hapus Jadwal Kuliah pada Smart Academic Planner (`TriadDashboard.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.56`
- **Ringkasan:** 
  1. **Tombol Hapus pada Kartu Jadwal Hari Ini:**
     - Menambahkan tombol hapus interaktif dengan ikon tempat sampah (`Trash2`) di sisi kanan setiap baris matakuliah pada bagian *"Jadwal Kuliah Hari Ini"*.
     - Dilengkapi efek hover merah pastel lembut (`bg-[#FEE2E2]` dan ikon `text-[#DC2626]`) dengan tooltip dan `aria-label` aksesibel.
  2. **Tab Kelola & Hapus Seluruh Matakuliah pada Modal KRS:**
     - Menambahkan tab *"Daftar (N)"* pada modal Smart Academic Planner untuk melihat seluruh matakuliah lintas hari (Senin s/d Minggu) dengan tombol hapus individual.
  3. **Penyesuaian State & Sinkronisasi Metrik:**
     - Menghubungkan fungsi `handleDeleteSchedule` ke state `schedules` dan pemanggilan `api.deleteAcademicSchedule(id)`.
     - Otomatis memperbarui total bobot SKS, skor beban kognitif akademik (`academicLoadScore`), dan indeks risiko kelelahan (*Burnout Risk Index*) secara real-time saat jadwal dihapus.
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `frontend/src/lib/api.ts`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Pembersihan Chat Dummy Awal, Perbaikan Fitur Reset Otomatis, dan Penyembunyian Rekomendasi Chat saat Obrolan Aktif (`CoachView.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.55`
- **Ringkasan:** 
  1. **Inisialisasi Chat Kosong Bersih (*Zero Dummy Messages*):**
     - Mengubah inisialisasi state `messages` dari mock dummy 3 balon chat menjadi array kosong (`[]`).
     - Menampilkan salam personal ringkas *"Hai, {userName}! Apa kabar hari ini?"* beserta tumpukan kartu rekomendasi chat topik sehat.
  2. **Penghilangan Rekomendasi Chat Bawah saat Obrolan Berlangsung:**
     - Menghapus duplikasi container rekomendasi chat di bagian bawah panel (`bg-[#FAFAF8]`).
     - Rekomendasi chat di area utama otomatis disembunyikan segera setelah pengguna mengklik salah satu rekomendasi atau mengirimkan pesan baru, sehingga antarmuka berfokus penuh pada dialog aktif.
  3. **Fungsionalitas Tombol Reset Otomatis Total:**
     - Tombol *"Reset"* di header AI Coach kini bekerja secara otomatis dan tuntas: membatalkan timer pengetikan asisten yang sedang berjalan (`typingTimeoutRef`), mengosongkan seluruh riwayat obrolan (`messages = []`), mengosongkan teks input, dan mengembalikan tampilan ke keadaan awal bersih dengan rekomendasi chat siap klik.
  4. **Perbaikan Syntax Popover Notifikasi:**
     - Memperbaiki tag div penutup pada `NotificationPopover.tsx` agar proses build TypeScript monorepo berjalan mulus 100%.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/CoachView.tsx`
  - `frontend/src/components/notifications/NotificationPopover.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Pembersihan Ikon Melayang dan Menu Titik Tiga pada Tiga Kartu Ritme Fokus (`FocusView.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.54`
- **Ringkasan:** 
  1. **Penghapusan Ikon Melayang Atas (*Floating Icon Badges*):**
     - Menghilangkan elemen lencana ikon persegi melayang (`-top-6`) berwarna violet (`#6C5CE7`) dengan ikon `Clock`, `Target`, dan `Monitor` pada ketiga kartu metrik "Ritme fokus hari ini".
  2. **Penghapusan Menu Titik Tiga (*Three-Dots Menu*):**
     - Menghapus ikon menu titik tiga vertikal (`MoreVertical`) pada sudut kanan atas setiap kartu untuk menghasilkan antarmuka yang bersih, tenang, dan minimalis.
  3. **Penyesuaian Spacing & Padding:**
     - Menyesuaikan padding kartu menjadi `p-5 sm:p-6` standar tanpa offset atas artifisial (`pt-9`), serta merapikan grid kontainer menjadi `gap-4 sm:gap-6` tanpa padding atas berlebih (`pt-6`).
  4. **Pembersihan Import:**
     - Menghapus import tak terpakai `Clock`, `Target`, `Monitor`, dan `MoreVertical` dari `lucide-react` pada `FocusView.tsx`.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/FocusView.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` lulus.
  - `npm run test:shared` lulus.
  - `npm run guard` lolos validasi zona branch.

---
- **ID Tugas / Referensi:** `FE-1.53`
- **Ringkasan:** 
  1. **Tombol Reset pada Header AI Coach:**
     - Menambahkan tombol pil putih *"Reset"* dengan ikon putar balik (`RotateCcw`) di sisi kanan header Wellbeing AI Coach mendampingi lencana *"Hari ini"*.
  2. **Fungsionalitas Reset:**
     - Mengembalikan sesi obrolan ke percakapan awal yang bersih (`INITIAL_MESSAGES`).
     - Mengatur ulang status interaksi (`hasChatted = false`) sehingga kartu rekomendasi chat kembali dapat diakses pengguna.
     - Mengosongkan input teks dan menghentikan status pengetikan aktif.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/CoachView.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Transformasi Desain Kartu Laporan Ritme Fokus ke Gaya Fitness Report Tiga Kartu (`FocusView.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.52`
- **Ringkasan:** 
  1. **Restrukturisasi Tiga Kartu Terpisah (*Fitness Workout Report Style*):**
     - Mengubah satu kontainer kartu horizontal ("Ritme fokus hari ini") menjadi 3 kartu metrik terpisah (*Total Sesi Selesai*, *Pomodoro Selesai*, *Waktu Layar Pasif*) sesuai inspirasi Foto 1.
  2. **Ikon Melayang Atas (*Floating Crown Icon Badge*):**
     - Menambahkan lencana ikon rounded square melayang di bagian tengah atas tiap kartu (`-top-6`) dengan warna violet elegan (`#6C5CE7`) dan ikon putih (`Clock`, `Target`, `Monitor`).
  3. **Penyesuaian Laporan Latihan Harian Murni (Tanpa Progress Bar):**
     - Mengikuti arahan pengguna bahwa kartu ini berfungsi sebagai laporan latihan/aktivitas harian (`2 j 05 m`, `5 sesi`, `10 jam`), bukan progress bar persentase.
     - Setiap kartu dilengkapi judul, subjudul durasi, angka metrik besar di tengah, rincian konteks bawah, serta lencana pill pink status (*"Hari ini"*, *"Aktif"*, *"Tercatat"*).
- **Daftar File Diubah:**
  - `frontend/src/components/pages/FocusView.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Pemindahan Posisi Simbol Kartu Parameter ke Sebelah Kiri Judul (`TriadDashboard.tsx`) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.51`
- **Ringkasan:** 
  1. **Pemindahan Simbol / Ikon ke Sisi Kiri Baris Judul:**
     - Mengubah tata letak 4 kartu ringkasan parameter klinis (*Beban kuliah*, *Waktu layar*, *Tidur semalam*, *Active break*) pada Triad Dashboard agar ikon kotak rounded berada di sisi kiri mendampingi judul metrik sesuai referensi Foto 2.
  2. **Harmonisasi Warna Kotak Ikon & Kartu:**
     - Kartu 1 (*Beban kuliah*): Ikon `<BookOpen />` dengan latar pastel soft pink (`#F7A8B0`).
     - Kartu 2 (*Waktu layar*): Ikon `<Monitor />` dengan latar pastel soft yellow (`#FFF29A`).
     - Kartu 3 (*Tidur semalam*): Ikon `<Moon />` dengan latar pastel soft sky blue (`#BDE6F0`).
     - Kartu 4 (*Active break*): Ikon `<Play />` dengan latar pastel soft mint green (`#CDE8B5`) pada kartu putih seragam.
  3. **Penataan Hirarki Teks:**
     - Angka nilai utama ditampilkan besar di bawah baris judul dan ikon, diikuti teks status/pemulihan di bagian bawah kartu.
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Pembaruan Format Input NIM Tanpa Ikon Hash dan Murni Angka Numerik (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.50`
- **Ringkasan:** 
  1. **Pembaruan Input NIM di Halaman Profil (`ProfileView.tsx`):**
     - Menghapus ikon `#` (`<Hash />`) dari input Nomor Induk Mahasiswa (NIM).
     - Menghapus padding `pl-10` menjadi `px-3.5` agar konsisten dan lapang.
     - Mengubah placeholder dari `4.xx.xx.x.xx` menjadi angka biasa `43324001`.
     - Menambahkan filter numerik murni (`replace(/[^0-9]/g, "")`) serta atribut `inputMode="numeric"`.
  2. **Pembaruan Konsistensi Modal Autentikasi (`AuthModal.tsx` & `campusflowMock.ts`):**
     - Menghapus ikon `#` dari input NIM registrasi dan menyesuaikan placeholder menjadi `43324001`.
     - Memperbarui data mock mahasiswa agar menggunakan format angka biasa tanpa titik.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/ProfileView.tsx`
  - `frontend/src/components/auth/AuthModal.tsx`
  - `frontend/src/mocks/campusflowMock.ts`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Pembersihan Footer Darurat, Ikon Motif Bunga, dan Alur Hilang Otomatis Rekomendasi Chat AI Coach (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.49`
- **Ringkasan:** 
  1. **Penghapusan Keterangan Bahaya Darurat (`CoachView.tsx` — Foto 1):**
     - Menghapus teks baris bawah *"Jika ada bahaya langsung, cari pertolongan darurat terdekat."* di bawah kolom pengetikan pesan chat.
  2. **Penghapusan Ikon Motif Bunga Meta AI (`CoachView.tsx` — Foto 2):**
     - Menghapus komponen motif bunga 8 kelopak warna-warni (`MetaAiMotif`) dari seluruh tampilan AI Coach agar antarmuka sepenuhnya bersih dan menyatu dengan tema pastel CampusFlow.
  3. **Penyesuaian Siklus Hidup Rekomendasi Chat (`CoachView.tsx` — Foto 3):**
     - Mengubah logika tampil kartu rekomendasi chat (`CHAT_RECOMMENDATIONS`) agar hanya muncul di awal sebelum interaksi pengguna (`!hasChatted`).
     - Begitu pengguna mengirimkan pesan manual melalui form input ataupun mengklik salah satu tombol rekomendasi cepat, seluruh daftar rekomendasi dan drawer langsung hilang permanen dari sesi percakapan.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/CoachView.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Pembersihan 5 Elemen Antarmuka pada ActivityView, ProfileView, PedometerCard, dan MimiPetWidget (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.48`
- **Ringkasan:** 
  1. **Penghapusan Kartu Panduan Smartphone (`ActivityView.tsx` — Foto 1):**
     - Menghapus kartu abu-abu panduan penggunaan pedometer di smartphone (*"Panduan Penggunaan di Smartphone: Buka aplikasi di browser HP Anda..."*) sehingga tampilan tab pedometer langsung terfokus pada data langkah.
  2. **Penghapusan Kartu Target Kebugaran & Kamera Postur (`ProfileView.tsx` — Foto 2):**
     - Menghapus kartu *"Target Kebugaran & Kebiasaan Belajar Sehat"* (slider target METs, ambang batas duduk, target tidur) dan kartu *"Pengaturan Posisi Duduk AI (Kamera)"*, menjaga halaman profil terfokus murni pada identitas dan data akademik mahasiswa.
  3. **Penghapusan Subjudul Pedometer Card (`PedometerCard.tsx` — Foto 3):**
     - Menghapus teks subjudul *"Deteksi Gerak Langkah HP • Akurat Tanpa Smartwatch • Nol Latensi"* di bawah judul *"Penghitung Langkah Otomatis (Sensor HP)"*.
  4. **Penghapusan Badge Level Maskot (`MimiPetWidget.tsx` — Foto 4):**
     - Menghapus pill badge hitam *"Level {st + 1} • {STAGE_NAMES[st]}"* pada header panggung arena maskot Mimi Pet.
  5. **Penghapusan Tab Lembar Evolusi (`MimiPetWidget.tsx` — Foto 5):**
     - Menghapus tombol navigasi tab dan tampilan kartu *"Lembar Evolusi (5 Level)"*, sehingga modal interaktif Mimi Pet langsung menampilkan panggung maskot dan misi harian secara terpadu tanpa tab switcher.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/ActivityView.tsx`
  - `frontend/src/components/pages/ProfileView.tsx`
  - `frontend/src/components/sensor/PedometerCard.tsx`
  - `frontend/src/components/pet/MimiPetWidget.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Pembersihan 5 Elemen Antarmuka pada Triad Dashboard (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.47`
- **Ringkasan:** 
  1. **Penghapusan Kartu Keseimbangan Fusi Parameter (`TriadDashboard.tsx` — Foto 1):**
     - Menghapus kartu rincian formula beban akademik & layar vs pemulihan tidur & jeda aktif (*"Keseimbangan Fusi Parameter"*) di sisi kanan hero card Burnout Risk Index.
  2. **Penghapusan Kartu Aksi Cepat Active Break & Panic Relief (`TriadDashboard.tsx` — Foto 2):**
     - Menghapus 2 kartu aksi ganda berwarna biru langit & kuning (*"Mulai Active Break 2 Menit"* dan *"Panic Relief 15 Menit"*) agar alur antarmuka Dashboard lebih ringkas.
  3. **Penghapusan Ikon Jam pada Jadwal Kuliah (`TriadDashboard.tsx` — Foto 3):**
     - Menghapus ikon jam (`<Clock />`) di samping judul *"Jadwal Kuliah Hari Ini"*.
  4. **Penghapusan Teks Keterangan Bobot SKS (`TriadDashboard.tsx` — Foto 4):**
     - Menghapus baris teks subjudul *"Beban kognitif otomatis dihitung dari bobot SKS dan jenis matakuliah"*.
  5. **Penghapusan Label Hari dalam Kurung (`TriadDashboard.tsx` — Foto 5):**
     - Menghapus teks penanda hari `(Rabu)` / `({DAY_NAMES[currentDayOfWeek - 1]})` sehingga judul tabel hanya menampilkan *"Jadwal Kuliah Hari Ini"*.
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Pembersihan 5 Elemen Antarmuka pada ActivityView, ProfileView, PedometerCard, dan MimiPetWidget (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.48`
- **Ringkasan:** 
  1. **Penghapusan Kartu Panduan Smartphone (`ActivityView.tsx` — Foto 1):**
     - Menghapus kartu abu-abu panduan penggunaan pedometer di smartphone (*"Panduan Penggunaan di Smartphone: Buka aplikasi di browser HP Anda..."*) sehingga tampilan tab pedometer langsung terfokus pada data langkah.
  2. **Penghapusan Kartu Target Kebugaran & Kamera Postur (`ProfileView.tsx` — Foto 2):**
     - Menghapus kartu *"Target Kebugaran & Kebiasaan Belajar Sehat"* (slider target METs, ambang batas duduk, target tidur) dan kartu *"Pengaturan Posisi Duduk AI (Kamera)"*, menjaga halaman profil terfokus murni pada identitas dan data akademik mahasiswa.
  3. **Penghapusan Subjudul Pedometer Card (`PedometerCard.tsx` — Foto 3):**
     - Menghapus teks subjudul *"Deteksi Gerak Langkah HP • Akurat Tanpa Smartwatch • Nol Latensi"* di bawah judul *"Penghitung Langkah Otomatis (Sensor HP)"*.
  4. **Penghapusan Badge Level Maskot (`MimiPetWidget.tsx` — Foto 4):**
     - Menghapus pill badge hitam *"Level {st + 1} • {STAGE_NAMES[st]}"* pada header panggung arena maskot Mimi Pet.
  5. **Penghapusan Tab Lembar Evolusi (`MimiPetWidget.tsx` — Foto 5):**
     - Menghapus tombol navigasi tab dan tampilan kartu *"Lembar Evolusi (5 Level)"*, sehingga modal interaktif Mimi Pet langsung menampilkan panggung maskot dan misi harian secara terpadu tanpa tab switcher.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/ActivityView.tsx`
  - `frontend/src/components/pages/ProfileView.tsx`
  - `frontend/src/components/sensor/PedometerCard.tsx`
  - `frontend/src/components/pet/MimiPetWidget.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Pembersihan 5 Elemen Antarmuka pada Triad Dashboard (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.47`
- **Ringkasan:** 
  1. **Penghapusan Kartu Keseimbangan Fusi Parameter (`TriadDashboard.tsx` — Foto 1):**
     - Menghapus kartu rincian formula beban akademik & layar vs pemulihan tidur & jeda aktif (*"Keseimbangan Fusi Parameter"*) di sisi kanan hero card Burnout Risk Index.
  2. **Penghapusan Kartu Aksi Cepat Active Break & Panic Relief (`TriadDashboard.tsx` — Foto 2):**
     - Menghapus 2 kartu aksi ganda berwarna biru langit & kuning (*"Mulai Active Break 2 Menit"* dan *"Panic Relief 15 Menit"*) agar alur antarmuka Dashboard lebih ringkas.
  3. **Penghapusan Ikon Jam pada Jadwal Kuliah (`TriadDashboard.tsx` — Foto 3):**
     - Menghapus ikon jam (`<Clock />`) di samping judul *"Jadwal Kuliah Hari Ini"*.
  4. **Penghapusan Teks Keterangan Bobot SKS (`TriadDashboard.tsx` — Foto 4):**
     - Menghapus baris teks subjudul *"Beban kognitif otomatis dihitung dari bobot SKS dan jenis matakuliah"*.
  5. **Penghapusan Label Hari dalam Kurung (`TriadDashboard.tsx` — Foto 5):**
     - Menghapus teks penanda hari `(Rabu)` / `({DAY_NAMES[currentDayOfWeek - 1]})` sehingga judul tabel hanya menampilkan *"Jadwal Kuliah Hari Ini"*.
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Pembersihan Elemen Rekomendasi AI Coach & Penyesuaian Teks Sapaan Mimi Pet (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.46`
- **Ringkasan:** 
  1. **Penghapusan Bilah Judul Drawer Rekomendasi (`CoachView.tsx` — Foto 1):**
     - Menghapus bilah strip judul horizontal *"Rekomendasi Obrolan untuk Mahasiswa"* beserta tombol *"Sembunyikan v"* pada bagian atas kartu rekomendasi chat agar daftar kartu langsung tersaji secara rapi dan tidak memakan ruang vertikal.
  2. **Penghapusan Tombol Header Rekomendasi (`CoachView.tsx` — Foto 2):**
     - Menghapus tombol hitam pill *"✨ Rekomendasi"* dari bilah header atas panel AI Coach untuk menjaga tampilan header tetap bersih dan minimalis.
  3. **Pembaruan Teks Sapaan Tooltip Mimi Pet (`MimiPetWidget.tsx` — Foto 3):**
     - Mengubah teks gelembung sapaan mengambang (*floating speech bubble*) Mimi Pet dari *"Halo! Ketuk Mimi • Geser"* menjadi *"Hai! apa kabar hari ini?"* sesuai permintaan pengguna.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/CoachView.tsx`
  - `frontend/src/components/pet/MimiPetWidget.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Implementasi Fitur Rekomendasi Chat Bergaya Meta AI pada AI Coach (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.45`
- **Ringkasan:** 
  1. **Kartu Rekomendasi Chat Vertikal (`CoachView.tsx`):**
     - Menambahkan 5 kartu rekomendasi obrolan bergaya Meta AI (kartu putih rounded, ikon di kiri, teks ramah, dan transisi hover tanpa translasi Y) sesuai referensi tangkapan layar `media_1794888200440_6058eb62.jpg`:
       - 📖 *"Saya ingin bantuan terkait tugas dan beban kuliah"*
       - ⏱ *"Saya ingin mengatur jadwal belajar dan istirahat seimbang"*
       - 🖥 *"Saya butuh saran peregangan leher dan mata lelah"*
       - 🌙 *"Saya ingin memulihkan kualitas tidur malam ini"*
       - ✨ *"Saya butuh saran untuk menenangkan pikiran saat stres"*
  2. **Hero State Awal / Sesi Baru dengan Spiral Motif:**
     - Menghadirkan logo motif spiral Meta AI bersama sapaan waktu dinamis (*"Selamat pagi/siang/sore/malam, {userName}"*) ketika percakapan baru dimulai atau setelah menekan tombol *"Sesi Baru"*.
  3. **Drawer & Toggle Rekomendasi Cepat:**
     - Pengguna dapat membuka atau menyembunyikan kartu rekomendasi kapan saja melalui tombol header *"Rekomendasi"* maupun pill pintasan di atas input chat.
  4. **Respons Interaktif Otomatis:**
     - Mengklik kartu rekomendasi langsung mengirim prompt ke thread obrolan, memicu efek mengetik real-time, memberikan jawaban empati berbasis manajemen burnout/ergonomi, dan mengarahkan auto-scroll ke pesan terbaru.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/CoachView.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Pembersihan Filter/Deskripsi Notifikasi dan Pembatasan Header Greeting Dashboard (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.44`
- **Ringkasan:** 
  1. **Pembersihan Header & Tab Filter Notifikasi (`NotificationPopover.tsx` — Foto 1):**
     - Menghapus subjudul teks *"Aktivitas, jeda & ritme akademik"* dan bilah filter tab *"Semua / Belum Dibaca"* pada popover notifikasi agar popover lebih ringkas dan tidak memakan ruang vertikal berlebih.
  2. **Penyederhanaan Teks Isi Notifikasi (`NotificationPopover.tsx` — Foto 2):**
     - Menghapus paragraf pesan deskripsi (`notif.message`, seperti *"Layar telah aktif lebih dari 45 menit. Tarik bahu ke belakang dan lakukan regangan leher."*) dari setiap kartu notifikasi sehingga item hanya menyajikan judul utama, penanda belum dibaca, waktu, dan tautan aksi secara bersih.
  3. **Pembatasan Greeting Header Khusus Dashboard (`Navbar.tsx` — Foto 3):**
     - Mengatur tampilan sapaan *"Hello, Mahasiswa! 👋 Your boards look so good! Let's keep the active momentum."* pada `DesktopTopHeader` dan `MobileHeader` agar hanya muncul pada halaman Dashboard (`activeTab === "dashboard"`). Pada halaman lain (Focus, Vision Lab, AI Coach, dll.) sapaan disembunyikan sehingga tidak bertumpuk dengan judul masing-masing halaman.
- **Daftar File Diubah:**
  - `frontend/src/components/notifications/NotificationPopover.tsx`
  - `frontend/src/components/Navbar.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi zona branch.

---

## [2026-11-17] — Penghapusan 5 Elemen Antarmuka Berdasarkan Permintaan Visual Pengguna (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.43`
- **Ringkasan:** 
  1. **Penghapusan Badge Kamera Aktif (`FocusView.tsx`):**
     - Menghapus badge hijau `Kamera Aktif` pada header modal Active Break sesuai referensi foto 1.
  2. **Penghapusan Status Sesi & Kotak Tugas Kuliah (`FocusView.tsx`):**
     - Menghapus pill status kuning `Sesi 6 · sedang berjalan` pada tepi busur lingkaran timer.
     - Menghapus kotak penugasan mata kuliah `Interaksi Manusia & Komputer — Menyusun wireframe tugas akhir` sesuai referensi foto 2.
  3. **Penghapusan Banner Krisis Pink (`CoachView.tsx`):**
     - Menghapus kartu peringatan krisis berlatar pink *"Keselamatanmu yang paling penting."* beserta tombol Hotline 119 dan tautan healing119.id sesuai referensi foto 3.
  4. **Penghapusan Badge Target Sehat (`HistoryView.tsx`):**
     - Menghapus badge hijau pill `{row.triadPillarsMet}/3 Target Sehat` pada setiap baris tabel catatan harian 14 hari sesuai referensi foto 4.
  5. **Penghapusan Tombol Simulasi Notifikasi (`NotificationPopover.tsx`):**
     - Menghapus tombol footer *"Simulasi Notifikasi Masuk (+ Baru)"* pada popover bilah notifikasi sesuai referensi foto 5.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/FocusView.tsx`
  - `frontend/src/components/pages/CoachView.tsx`
  - `frontend/src/components/pages/HistoryView.tsx`
  - `frontend/src/components/notifications/NotificationPopover.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` sukses memvalidasi batasan scope kerja.

---

## [2026-11-17] — Pembersihan Tombol Kontrol pada 4 Kartu Metrik Triad Dashboard (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.42`
- **Ringkasan:** 
  1. **Pembersihan Elemen Tombol Foto 1 (`TriadDashboard.tsx`):**
     - Menghapus tombol pemicu `KRS &rarr;` pada kartu Beban Kuliah.
     - Menghapus badge pill `AMAN / PENALTI` pada kartu Waktu Layar Pasif.
     - Menghapus tombol interaksi `-` dan `+` pada kartu Durasi Tidur Malam.
     - Menghapus tombol aksi `+1 Jeda` dan `Mulai &rarr;` pada kartu Active Break 2 Menit.
  2. **Penyajian Murni Output & Keterangan Informatif (Sesuai Foto 2):**
     - Keempat kartu metrik kini bersih (*clean output summary cards*) tanpa tombol interaksi yang membebani visual.
     - Menampilkan keterangan output yang rapi dan informatif:
       - Kartu 1: Keterangan beban SKS kuliah aktif.
       - Kartu 2: Keterangan total waktu layar terdeteksi.
       - Kartu 3: Keterangan total jam tidur user terdata.
       - Kartu 4: Keterangan poin pemulihan terverifikasi.
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` sukses memvalidasi zona kerja branch `frontend`.

---

## [2026-11-17] — Implementasi Pusat Notifikasi Interaktif & Pengingat Aktivitas Kampus (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.41`
- **Ringkasan:** 
  1. **Komponen Pusat Notifikasi (`NotificationPopover.tsx`):**
     - Membangun popover panel floating interaktif dengan tema *Fresh Pastel Health* yang dapat diakses langsung dari tombol lonceng navigasi.
     - Menyediakan indikator badge counter dinamis berwarna merah muda `#F7A8B0` saat terdapat notifikasi belum dibaca.
     - Menyediakan tab filter **Semua** dan **Belum Dibaca** beserta tombol **Tandai Dibaca** secara massal (*mark all as read*).
     - Menghubungkan setiap notifikasi dengan aksi langsung (*actionable direct link*):
       - Notifikasi Active Break: langsung mengarahkan ke tab `focus` (Workstation & Jeda).
       - Notifikasi Pekan Ujian UAS: langsung mengarahkan ke tab `dashboard` (Strava Akademik).
       - Notifikasi AI Coach: langsung mengarahkan ke tab `coach`.
       - Notifikasi Streak Mimi Pet (+50 XP): langsung mengarahkan ke tab `profile`.
     - Menyediakan fitur hapus per-notifikasi dan tombol **"Simulasi Notifikasi Masuk (+ Baru)"** untuk pengujian langsung oleh pengguna.
     - Menyimpan status baca/hapus secara persisten di `localStorage` (`cf_notifications`).
  2. **Integrasi Bilah Navigasi (`Navbar.tsx`):**
     - **Desktop Header (`DesktopTopHeader`):** Tombol lonceng kini membuka popover mengambang yang responsif dengan efek klik luar (*click outside to close*).
     - **Mobile Header (`MobileHeader`):** Menyematkan tombol lonceng notifikasi di samping avatar pengguna agar fitur dapat digunakan penuh pada layar ponsel pintar.
- **Daftar File Diubah:**
  - `frontend/src/components/notifications/NotificationPopover.tsx` (baru)
  - `frontend/src/components/Navbar.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` sukses memvalidasi zona kerja branch `frontend`.

---

## [2026-11-17] — Redesain Timer Sesi Fokus & Kerapian Lingkaran Hijau Workstation (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.40`
- **Ringkasan:** 
  1. **Header Halaman Fokus (`FocusView.tsx`):**
     - Mengubah judul menjadi *"Satu hal dalam satu waktu."* dan subjudul *"Beri ruang untuk fokus. Jangan lupa beri waktu untuk pulih."*
  2. **Kartu Utama Workstation Timer Sesuai Referensi Visual:**
     - Menata header kartu dengan label uppercase `SESI FOKUS`, switcher durasi preset `25 menit` (aktif warna kuning `#FFF29A`) / `50 menit`, dan badge privasi `Kamera mati` warna biru muda `#BDE6F0`.
     - **Pemusatan Lingkaran & Teks Timer (*Perfect Centering*):**
       - Menghitung ulang koordinat SVG lingkaran progress (`stroke-[#CDE8B5]` dengan track background `#EDF6E8`) di tengah container `viewBox 0 0 250 250` pada radius 105.
       - Teks countdown (default `18:42`) dan subteks *"Tetap di sini, satu langkah lagi."* diposisikan presisi di titik pusat lingkaran menggunakan flexbox centering dan font `tabular-nums` agar tidak ada pergeseran angka saat countdown berjalan.
       - Meletakkan pill kuning status sesi *"Sesi 6 · sedang berjalan"* rapi tepat di tepi bawah lingkaran.
     - **Kotak Mata Kuliah:** Menampilkan detail tugas aktif *"Interaksi Manusia & Komputer — Menyusun wireframe tugas akhir"*.
     - **Tombol Kontrol:** Tombol utama hitam *"Jeda sesi"* dan tombol sekunder abu-abu *"Reset"*.
  3. **Kartu Statistik Bawah ("Ritme fokus hari ini"):**
     - Menyajikan metrik 3 kolom rapi: *2 j 05 m Total sesi selesai*, *5 sesi Pomodoro selesai*, dan *10 jam Waktu layar pasif*.
  4. **Active Break On-Demand:**
     - Modal jeda aktif 2 menit dengan validasi pose kamera laptop (`VisionGuard`) tetap terintegrasi aman saat sesi selesai atau dibuka melalui badge status kamera.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/FocusView.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` sukses validasi batasan scope kerja.

---

## [2026-11-17] — Redesain Penuh Halaman AI Coach Sesuai Referensi Visual (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.39`
- **Ringkasan:** 
  1. **Header Halaman Empatik (`CoachView.tsx`):**
     - Mengubah judul utama menjadi *"Kamu tidak sendirian."* dengan tipografi tebal kontras dan subjudul *"Kenali kebutuhan tubuh dan pikiranmu bersama Wellbeing AI Coach."*.
  2. **Kolom Kiri 3 Kartu Kontekstual Mahasiswa:**
     - **Kartu 1 ("Cerita tubuhmu hari ini"):** Menampilkan 3 pilar metrik harian dengan ikon kontainer pastel: Beban kuliah (24 SKS · Pekan ujian) berikon merah muda, Paparan layar (10 jam · Butuh jeda) berikon kuning, dan Pemulihan tidur (6 jam dari target 8 jam) berikon biru muda.
     - **Kartu 2 ("Sedikit lebih baik, hari ini."):** Berlatar hijau pastel lembut `#F2F8EE` dengan 3 nomor pill `01`, `02`, `03` (Ambil 2 jeda aktif, Jalan santai 20 menit, dan Tidur lebih awal).
     - **Kartu 3 ("Ruang aman untuk bercerita"):** Berlatar biru muda `#BDE6F0` dengan ikon perisai (`ShieldCheck`) menegaskan privasi dan etika pendamping non-medis.
  3. **Panel Chat Interaktif & Safety Guardrail:**
     - Header bilah atas warna `#BDE6F0` dengan ikon hati, nama bot, subjudul *"Pendamping ritme sehatmu"*, serta badge *"Hari ini"*.
     - Tata letak balon pesan persis gambar: pesan AI berlatar abu-abu netral `#F2F2F2` dan pesan mahasiswa berlatar hijau pastel `#E5F5D9` di sisi kanan.
     - Banner keselamatan krisis *"Keselamatanmu yang paling penting."* berlatar pink lembut `#FDE2E4` dengan tombol aksi telepon darurat *"Hubungi 119 · Ekstensi 8"* dan tautan rujukan *"healing119.id ↗"*.
     - Bilah input pesan melengkung rapi (*pill shape*) dengan tombol kirim panah hitam bulat dan teks jaminan bantuan darurat di bagian bawah.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/CoachView.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` sukses tanpa error TypeScript.
  - `npm run test:frontend` lulus 13/13 tes unit.
  - `npm run test:shared` lulus 5/5 tes unit.
  - `npm run guard` sukses memvalidasi zona kerja branch `frontend`.

---

## [2026-11-17] — Pemisahan Tombol & Penyempurnaan Alur Penuh Masuk (Login) dan Daftar (Register) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.38`
- **Ringkasan:** 
  1. **Pemisahan Tombol Masuk (Login) & Daftar (Register) pada Navigasi (`LandingPage.tsx`):**
     - Memisahkan tombol gabungan menjadi dua tombol terpisah yang jelas pada header desktop: tombol teks/ghost **Masuk** (`LogIn` icon) dan tombol pill pastel hijau **Daftar** (`UserPlus` icon).
     - Menyediakan dua tombol terpisah pada drawer navigasi mobile untuk pengalaman pengguna perangkat sentuh.
     - Menambahkan Action Bar CTA terdedikasi pada Hero Section: **Daftar Akun Mahasiswa (Register)** dan **Masuk ke Akun (Login)**.
     - Menyediakan tombol Masuk dan Daftar terpisah pada footer bawah.
  2. **Penyempurnaan Reaktivitas & Fitur Modal (`AuthModal.tsx`):**
     - Menambahkan hook `useEffect` agar state tab modal selalu sinkron secara reaktif dengan parameter tombol pemicu (`login` vs `register`).
     - Menambahkan fitur intip/sembunyikan password (`Eye` / `EyeOff`) pada form Masuk dan form Daftar.
     - Menambahkan tautan silang instan di bawah setiap form: *"Belum memiliki akun? Daftar di sini"* dan *"Sudah memiliki akun? Masuk di sini"*.
  3. **Manajemen Sesi Logout (`App.tsx`):**
     - Mengintegrasikan fungsi `handleLogout` yang membersihkan auth token di `localStorage` dan mereset data profil pengguna ketika kembali ke Landing Page.
- **Daftar File Diubah:**
  - `frontend/src/components/auth/AuthModal.tsx`
  - `frontend/src/components/pages/LandingPage.tsx`
  - `frontend/src/App.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` sukses validasi batasan scope kerja.

---

## [2026-11-17] — Implementasi Modal Autentikasi Interaktif (Sign In & Sign Up) Landing Page (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.37`
- **Ringkasan:** 
  1. **Komponen Modal Autentikasi Interaktif (`AuthModal.tsx`):**
     - Membangun modal autentikasi pop-up elegan dengan backdrop blur (`bg-black/40 backdrop-blur-xs`) dan animasi buka/tutup halus.
     - Menyediakan tab switcher ramah pengguna: **Masuk (Sign In)** dan **Daftar (Sign Up)** dengan aksen warna aktif `#FFF29A`.
     - Form Sign In dilengkapi field Email Kampus (`Mail`), Password (`Lock`), toggle visibilitas sandi, submit button `#CDE8B5`, dan fitur pintas **"Masuk Cepat (Akun Demo Mahasiswa)"** untuk eksplorasi instan tanpa input manual.
     - Form Sign Up dilengkapi Nama Lengkap (`User`), NIM (`Hash`), Program Studi (`BookOpen`), Email Kampus, dan Password dengan validasi kelengkapan data.
  2. **Integrasi Klien API Autentikasi (`api.ts`):**
     - Mengimplementasikan fungsi `login(email, password)`, `register(payload)`, dan `loginDemo()` yang terintegrasi dengan penyimpanan token dan profil di `localStorage` (`cf_auth_token`, `cf_user_profile`) serta siap tersambung ke backend API.
  3. **Wiring Tombol Landing Page & State App (`LandingPage.tsx` & `App.tsx`):**
     - Menghubungkan tombol "Sign up / Masuk" di navbar utama, menu hamburger mobile, tombol modul kursus, dan footer ke pembukaan `AuthModal`.
     - Menyambungkan callback `onLoginSuccess` ke `App.tsx` agar state profil pengguna langsung terisi dinamis ke seluruh panel dashboard.
- **Daftar File Diubah:**
  - `frontend/src/components/auth/AuthModal.tsx` (baru)
  - `frontend/src/lib/api.ts`
  - `frontend/src/components/pages/LandingPage.tsx`
  - `frontend/src/App.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` sukses tanpa error TypeScript.
  - `npm run test:frontend` lulus 13/13 unit test.
  - `npm run test:shared` lulus 5/5 unit test.
  - `npm run guard` lulus validasi scope kerja monorepo.

---

## [2026-11-17] — Pembaruan Warna Background Navbar Landing Page (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.36`
- **Ringkasan:** 
  1. **Warna Navbar Pastel Blush Pink (`LandingPage.tsx`):**
     - Mengubah warna latar belakang header navigasi atas Landing Page menjadi soft pastel blush pink (`bg-[#FDF0F2]/95 backdrop-blur-md`) sesuai sampel warna foto 1 (`#FDF0F2`).
     - Menyelaraskan warna border pemisah menjadi `#F7D6DC` dan memperbarui menu dropdown mobile (`bg-[#FDF0F2]/98 border-b border-[#F7D6DC]`).
     - Memperbarui efek hover item navigasi desktop dan mobile menjadi `hover:bg-white/80` yang kontras dan lembut di atas latar `#FDF0F2`.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/LandingPage.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-17] — Transformasi Landing Page Full-Width & Penghapusan Background Gradient Biru (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.35`
- **Ringkasan:** 
  1. **Landing Page Full-Width Edge-to-Edge (`LandingPage.tsx`):**
     - Mengubah arsitektur layout Landing Page dari tampilan bingkai kartu melayang (*floating mockup container*) dengan sudut membulat tebal (`rounded-[2.5rem] shadow-2xl`) menjadi tata letak halaman web penuh (*full-width edge-to-edge*).
     - Menghapus latar belakang gradient cyan/biru (`bg-gradient-to-br from-[#8ED6DB] via-[#A6E1E6] to-[#CDE8B5]`) yang sebelumnya membingkai konten di belakang kartu, menggantinya dengan latar belakang putih bersih (`bg-white`).
     - Menyusun seksi berurutan (#home, #courses, #about, #contact) di dalam container terpusat `max-w-6xl mx-auto` yang mengalir mulus tanpa celah tepi atau shadow tebal yang membebani mata.
     - Memperbarui footer menjadi bilah penuh (*full-width border-t*) dengan identitas brand CampusFlow di sisi kiri dan tombol cepat masuk dashboard di sisi kanan.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/LandingPage.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-17] — Pembuatan Dokumen Desain Sistem & Arsitektur UI/UX Master (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.34`
- **Ringkasan:** 
  1. **Penyusunan Dokumen Desain Master `desain.md`:**
     - Menyusun dokumen spesifikasi desain sistem dan arsitektur UI/UX komprehensif (`desain.md` di root dan `docs/frontend/desain.md`) selaras dengan PRD v4.0.
     - Merangkum 9 bab utama: Visi & Positioning Produk (*Academic Strava*), Filosofi Desain *Fresh Pastel Health* (Token `#CDE8B5`, `#FFF29A`, `#F7A8B0`, `#BDE6F0`, `#1A1A1A`), Formulasi Matematis Algoritma Burnout Risk Index (0–100), Arsitektur Privasi *Zero Continuous Camera*, Peta Halaman & Alur Pengguna (Landing Page, Triad Dashboard, Focus View, Coach View, Profile View, History View), Fitur Maskot Interaktif Mimi (Draggable, Customizable Name, Audio Synth, 4 Tahap Evolusi), Arsitektur Teknis Frontend & PWA, Standar Aksesibilitas WCAG AA & Anti-Slop, serta Tata Kelola 3-Branch Monorepo.
- **Daftar File Diubah:**
  - `desain.md` (baru)
  - `docs/frontend/desain.md` (baru)
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Catatan Cross-Scope:** `[CROSS-SCOPE] desain.md` — Pembuatan dokumen desain master repositori di root project atas instruksi eksplisit pengguna, dilengkapi salinan di `docs/frontend/desain.md`.
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo dengan cross-scope advisory tercatat resmi.

---

## [2026-11-17] — Pembersihan Badge Status AI Coach, Diagnosis Kebugaran & Pill View (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.33`
- **Ringkasan:** 
  1. **Hapus Badge Pill "Aktif Hari Ini" & "Ollama Local AI • Guardrail 119" (`CoachView.tsx`):**
     - Menghapus sepasang badge pill status pada header Wellbeing AI Coach (Foto 1) agar judul header lebih bersih dan fokus.
  2. **Hapus Badge Pill "DIAGNOSIS KEBUGARAN" & Subjudul Analisis (`CoachView.tsx`):**
     - Menghapus label kuning "Diagnosis Kebugaran" beserta teks deskripsi "Analisis Komprehensif Triad Mahasiswa" (Foto 2) sehingga ringkasan diagnosa utama langsung ditampilkan tanpa label redundan.
  3. **Hapus Badge Pill "4/4 Terbuka" (`HistoryView.tsx`):**
     - Menghapus badge pill kuning pada kartu "Lencana Pencapaian (Badges)" (Foto 3).
  4. **Hapus Badge Pill "Strava View" (`TriadDashboard.tsx`):**
     - Menghapus badge pill kuning pada kartu grafik tren burnout & pemulihan 14 hari (Foto 4).
- **Daftar File Diubah:**
  - `frontend/src/components/pages/CoachView.tsx`
  - `frontend/src/components/pages/HistoryView.tsx`
  - `frontend/src/components/TriadDashboard.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 unit test lolos).
  - `npm run test:shared` (5/5 unit test lolos).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-16] — Pembersihan Kartu Pitching CCTV, Badge Distres/API & Ikon Dekoratif (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.32`
- **Ringkasan:** 
  1. **Hapus Kartu & Modal "Smart Campus CCTV Recovery Zone" (`TriadDashboard.tsx`):**
     - Menghapus kartu pitching juri Techcomfest 2027 Section 3.6 (Foto 1) dan modal simulasi CCTV kampus untuk menyederhanakan arsitektur dashboard Strava Akademik.
     - Membersihkan state `isCctvModalOpen`, `cctvVerified`, fungsi `handleSimulateCctvBreak`, serta impor `QrCode`, `Video`, dan `CheckCircle2`.
  2. **Hapus Badge Pill "MITIGASI DISTRES UJIAN" (`TriadDashboard.tsx`):**
     - Menghapus badge pill kuning pada kartu Panic Relief 15 Menit (Foto 2) agar kartu aksi jeda cepat konsisten dan minimalis.
  3. **Hapus Badge Pill "Page Visibility API" (`FocusView.tsx`):**
     - Menghapus badge pill biru muda penanda API pelacakan pasif pada kartu metrik waktu layar (Foto 3).
  4. **Hapus Ikon Lightning Bolt (`FocusView.tsx`):**
     - Menghapus ikon `Zap` berwarna hitam pada kartu pemicu cepat jeda aktif "Kamera Insidental 2 Menit" (Foto 4) dan membersihkan impor `Zap`.
  5. **Hapus Ikon Hijau Sparkles (`CoachView.tsx`):**
     - Menghapus ikon dekoratif `Sparkles` berwarna hijau pada judul kartu "Rencana Sehat & Jeda Aktif Hari Ini" (Foto 5) dan membersihkan impor `Sparkles`.
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `frontend/src/components/pages/FocusView.tsx`
  - `frontend/src/components/pages/CoachView.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (13/13 unit test lolos).
  - `npm run test:shared` (5/5 unit test lolos).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-16] — Pembersihan Kartu Edukasi, Pengaturan Ergonomi Opsional & Badge Pill Privasi (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.31`
- **Ringkasan:** 
  1. **Hapus Kartu "Prinsip Effort-Recovery Model" (`TriadDashboard.tsx`):**
     - Menghapus banner biru sitasi riset motivasi kuantifikasi pemulihan (Foto 1) agar tampilan dashboard ritme akademis lebih ramping dan fokus pada visualisasi beban vs pemulihan.
     - Membersihkan impor ikon `Flame` yang tidak terpakai.
  2. **Hapus Akordion "Lab Kalibrasi Postur Belajar & Pengaturan Ergonomi (Opsional)" (`FocusView.tsx`):**
     - Menghapus bagian akordion Section 4 yang memuat uji postur kamera opsional (Foto 2) untuk menegaskan prinsip zero continuous camera selama sesi belajar.
     - Membersihkan state `isPostureLabOpen` serta impor ikon `ChevronDown`, `ChevronUp`, dan `Sparkles`.
  3. **Hapus Kartu "Privasi Terjaga Penuh" (`FocusView.tsx`):**
     - Menghapus kartu informasi penjaminan privasi kamera (Foto 3) agar area kerja workstation lebih ringkas dan langsung berfokus pada tombol aksi validator jeda aktif.
     - Membersihkan impor ikon `ShieldCheck` yang tidak terpakai.
  4. **Hapus Badge Pill "OPTIMAL / AMAN" (`TriadDashboard.tsx`):**
     - Menghapus status badge pill warna hijau pada kartu utama Hero Card (Foto 4).
  5. **Hapus Badge Pill "ZERO CONTINUOUS CAMERA" (`TriadDashboard.tsx` & `FocusView.tsx`):**
     - Menghapus pill badge "Zero Continuous Camera" pada kartu quick trigger jeda aktif di dashboard dan header workstation (Foto 5).
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `frontend/src/components/pages/FocusView.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript (dist bundle 898 kB).
  - `npm run test:frontend` (13/13 unit test lolos).
  - `npm run test:shared` (5/5 unit test lolos).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-16] — Penyelarasan Frontend dengan README Terbaru & Arsitektur PRD v4.0 (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.30`
- **Ringkasan:** 
  1. **Dashboard Strava Akademik, Smart Academic Planner & CCTV Zone (`TriadDashboard.tsx`):**
     - Mengubah hero dashboard menjadi metrik terpadu **Burnout Risk Index (0–100)**:
       $$\text{Burnout Risk Index} = (\text{Academic Load Score} + \text{Screen Time Fatigue}) - \text{Recovery Score}$$
     - Indikator status warna: Hijau (< 40, Optimal/Aman), Kuning (40–75, Waspada), dan Merah (> 75, Risiko Tinggi).
     - Menampilkan visualisasi ritme mingguan Strava Akademik: Beban Mingguan (SKS KRS + Layar) vs Skor Pemulihan (Tidur & Jeda Aktif).
     - Menambahkan 4 kartu parameter klinis fusi: Beban Kuliah (KRS), Waktu Layar Pasif, Jam Tidur Restoratif, dan Active Break Terverifikasi.
     - Mengintegrasikan modal interaktif **Smart Academic Planner (PDF KRS Parser & Schedule)** dengan 2 tab: Dropzone Upload Berkas PDF KRS (ekstraksi otomatis SKS & kelas) dan Input Manual.
     - Menambahkan kartu & modal materi pitching juri Techcomfest 2027: **Smart Campus CCTV Recovery Zone** (peregangan di fasilitas publik kampus via Edge AI & QR scan).
     - Menampilkan grafik tren Recharts 14 hari perbandingan Burnout Index dan Skor Pemulihan.
  2. **Zero Continuous Camera & Workstation Belajar Mandiri (`FocusView.tsx`, `VisionGuard.tsx`):**
     - Menerapkan prinsip **Zero Continuous Camera**: kamera laptop default **OFF** selama jam belajar mahasiswa.
     - Melacak durasi fokus layar secara pasif menggunakan Page Visibility API (`document.hidden`) & Focus Events tanpa menyalakan webcam.
     - Menyediakan tombol on-demand **"Mulai Active Break (2 Menit)"** yang membuka modal validator pose MediaPipe WASM insidental 2 menit untuk 3x peregangan overhead reach.
     - Menghubungkan verifikasi jeda aktif ke endpoint `api.verifyActiveBreak()`, menambahkan +10 poin pemulihan ke Burnout Index, dan mematikan stream kamera secara otomatis begitu gerakan selesai.
  3. **Wellbeing AI Coach Proaktif & Crisis Gateway 119 (`CoachView.tsx`):**
     - Mengintegrasikan deteksi kata kunci distres berat / krisis emosional yang secara otomatis mengaktifkan peringatan darurat **Crisis Gateway 119** (Hotline 119 ext. 8 / healing119.id).
     - Menambahkan indikator status inferensi AI lokal: *Ollama Local AI (campusflow-coach)* dengan aturan jam malam ($\ge 21.30\text{ WIB}$) untuk memprioritaskan pemulihan tidur.
  4. **Penyelarasan Landing Page (`LandingPage.tsx`):**
     - Memperbarui headline dan subjudul hero carousel ke tema PRD v4.0: "Academic Strava & Predictive Burnout Management", "Zero Continuous Camera (Privasi 100%)", dan "Burnout Risk Index (0–100)".
     - Menyelaraskan katalog modul pembelajaran ke 4 pilar v4.0: Smart Academic Planner, Cross-Device Screen Time, Active Break 2 Menit, dan Wellbeing AI Coach.
     - Memperbarui 3 pilar utama di bagian About dan memperbarui FAQ untuk menegaskan privasi tanpa rekaman webcam kontinu.
  5. **Pembaruan Navigasi & Label Subtitle (`Navbar.tsx`):**
     - Memperbarui label menu navigasi: `focus` menjadi "Workstation & Jeda", `dashboard` menjadi "Dashboard Strava".
     - Memperbarui subtitle brand sidebar menjadi "Academic Strava".
  6. **Utilitas Kalkulator Burnout Client-Side & Unit Test (`burnoutCalculator.ts`, `burnoutCalculator.test.ts`):**
     - Membuat fungsi deterministik client-side `calculateAcademicLoadScore`, `calculateScreenTimeFatigue`, `calculateRecoveryScore`, dan `calculateBurnoutRiskIndex`.
     - Menambahkan 4 unit test baru yang menguji kalkulasi SKS, penalti kelebihan layar > 8 jam, skor pemulihan, dan klasifikasi status risiko (13/13 test lolos).
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `frontend/src/components/pages/FocusView.tsx`
  - `frontend/src/components/pages/CoachView.tsx`
  - `frontend/src/components/vision/VisionGuard.tsx`
  - `frontend/src/components/pages/LandingPage.tsx`
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/utils/burnoutCalculator.ts`
  - `frontend/src/utils/burnoutCalculator.test.ts`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript (dist bundle 890 kB).
  - `npm run test:frontend` (13/13 unit test lolos).
  - `npm run test:shared` (5/5 unit test lolos).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-14] — Pembersihan Badge & Elemen Informasi Wellbeing AI Coach (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.29`
- **Ringkasan:** 
  1. **Hapus Badge Pill "Gemini 2.5 Flash" (`CoachView.tsx`):**
     - Menghapus badge pill hijau model AI pada header Wellbeing AI Coach (Foto 1), membuat header modul lebih bersih.
  2. **Hapus Badge Pill "Fokus Utama: ..." (`CoachView.tsx`):**
     - Menghapus badge pill kuning faktor mediator dominan (Foto 2) dan membersihkan fungsi helper `formatDominantFactor`.
  3. **Hapus Ikon Sparkles (`CoachView.tsx`):**
     - Menghapus ikon dekoratif `Sparkles` pada subjudul rencana aksi sehat (Foto 3).
  4. **Hapus Ikon Target (`CoachView.tsx`):**
     - Menghapus ikon bullseye `Target` pada baris target energi gerak harian (Foto 4).
  5. **Hapus Kotak Informasi "Dasar Riset" (`CoachView.tsx`):**
     - Menghapus seluruh kotak sitasi saintifik "Dasar Riset" (Foto 5) untuk penyajian rekomendasi aksi yang lebih padat dan langsung pada sasaran (*actionable*).
- **Daftar File Diubah:**
  - `frontend/src/components/pages/CoachView.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (9/9 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-14] — Pembersihan Badge Pill Header & Status (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.28`
- **Ringkasan:** 
  1. **Hapus Badge Pill "Akselerasi GPU" (`VisionGuard.tsx`):**
     - Menghapus badge pill hijau akselerasi hardware pada header Vision Guard (Foto 1) dan membersihkan state `hardwareDelegate` yang tidak lagi digunakan.
  2. **Hapus Badge Pill "Deteksi Postur AI" (`FocusView.tsx`):**
     - Menghapus badge pill hijau pada judul modul Sesi Belajar & Vision Guard (Foto 2).
  3. **Hapus Badge Pill "Privasi Aman: Video Tidak Diunggah" (`FocusView.tsx`):**
     - Menghapus badge pill kuning keamanan video di header FocusView (Foto 3) dan merapikan kartu info perangkat.
  4. **Hapus Badge Pill "Diam / Santai (1x Intensitas)" (`PedometerCard.tsx`):**
     - Menghapus badge pill intensitas status di header kartu pedometer (Foto 4) serta membersihkan fungsi helper `getBadgeStyle` dan `getIntensityLabel`.
  5. **Hapus Badge Pill "100% On-Device & Privat" (`ActivityView.tsx`):**
     - Menghapus badge pill privasi di header modul Aktivitas Fisik (Foto 5), menghasilkan tampilan header yang lapang dan terfokus.
- **Daftar File Diubah:**
  - `frontend/src/components/vision/VisionGuard.tsx`
  - `frontend/src/components/pages/FocusView.tsx`
  - `frontend/src/components/sensor/PedometerCard.tsx`
  - `frontend/src/components/pages/ActivityView.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (9/9 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-14] — Pembersihan Badge Pill Berlebih & Ikon Sparkles (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.27`
- **Ringkasan:** 
  1. **Hapus Badge Pill "Deteksi Otomatis HP" & "Evaluasi Harian" (`ActivityView.tsx`):**
     - Menghapus badge pill pastel hijau pada header modul Aktivitas Fisik & Evaluasi Kebugaran sesuai tangkapan layar pengguna (Foto 1 & Foto 2), menjadikan judul modul lebih bersih dan lega.
  2. **Hapus Ikon Dekoratif Sparkles (`ActivityView.tsx`, `CheckinView.tsx`, `MimiPetWidget.tsx`):**
     - Menghapus ikon dekoratif `Sparkles` pada kartu panduan penggunaan smartphone di modul Aktivitas (Foto 3), heading evaluasi stres PSS-4, dan panel simulasi pet, menjaga antarmuka tetap bersih, rapi, dan bebas dari elemen dekoratif AI yang tidak perlu.
  3. **Hapus Badge Pill "Posisi Duduk Tersimpan" (`ProfileView.tsx`):**
     - Menghapus badge pill status pada kartu Pengaturan Posisi Duduk AI (Foto 4) agar judul pengaturan lebih sederhana dan fokus langsung pada tombol aksi "Atur Ulang / Mulai Atur Posisi".
  4. **Hapus Badge Pill "Mahasiswa Aktif" (`ProfileView.tsx`):**
     - Menghapus badge pill hijau "Mahasiswa Aktif" di samping nama profil pengguna (Foto 5) untuk tampilan profil yang lebih bersih dan minimalis.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/ActivityView.tsx`
  - `frontend/src/components/pages/CheckinView.tsx`
  - `frontend/src/components/pages/ProfileView.tsx`
  - `frontend/src/components/pet/MimiPetWidget.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (9/9 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-13] — Kustomisasi Nama Pet Streak oleh Pengguna (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.26`
- **Ringkasan:** 
  1. **Fitur Kustomisasi Nama Pet Mandiri:**
     - Menambahkan fungsionalitas bagi pengguna untuk mengubah dan memberi nama panggilan unik pada pet virtual (*streak companion*).
     - Menyediakan mode edit *inline* dengan tombol pensil (`Pencil`) pada header modal Mimi Pet Hub, tombol *"Ganti Nama"* pada area panggung pet, dan tombol kustomisasi pada panel kontrol simulasi.
     - Formulir edit dilengkapi kolom teks responsif (maks. 20 karakter), tombol simpan (`Check`), tombol batal (`X`), serta dukungan tombol *Enter* untuk simpan cepat dan *Escape* untuk membatalkan.
  2. **Persistensi & Efek Respon Interaktif:**
     - Nama pet tersimpan secara otomatis dan persisten ke dalam `localStorage` (`campusflow_mimi_pet_state`) bersama progres streak, quest harian, dan freeze.
     - Saat nama baru disimpan, pet memberikan respon emosional riang (*excited*), lonjakan partikel cinta & bintang (`animate-mimi-pop`), serta balon dialog ucapan terima kasih: *"Nama baruku sekarang [Nama]! Aku suka banget. Makasih ya!"*.
  3. **Pembaruan Dinamis di Seluruh Komponen Pet:**
     - Balon sapaan tooltip mengambang (`Halo! Ketuk [Nama]`), label aksesibilitas (`aria-label`), tab navigasi (*Panggung [Nama] & Misi*), teks evolusi, serta seluruh dialog interaksi kini menyematkan nama kustom pilihan pengguna.
- **Daftar File Diubah:**
  - `frontend/src/components/pet/MimiPetWidget.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (9/9 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-13] — Integrasi Pet Streak Interaktif "Mimi" (Mengambang & Bisa Digeser) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.25`
- **Ringkasan:** 
  1. **Komponen Pet Mascot Mengambang & Draggable (`MimiPetWidget.tsx`):**
     - Membangun maskot virtual *"Mimi"* yang mengambang bebas (*floating overlay*) di atas antarmuka dashboard CampusFlow.
     - Mengimplementasikan sistem geser (*draggable pointer tracking*) yang halus dan responsif untuk mouse dan sentuhan layar (touch), dengan batas layar (*viewport clamping*) dan penyimpanan posisi otomatis di `localStorage`.
     - Menyediakan indikator badge streak api (`🔥 {streak}d`) dan balon sapaan interaktif (*speech bubble*) saat idle.
  2. **Evolusi Karakter & Mood Dinamis (`mimiSvg.ts`):**
     - Mengintegrasikan renderer SVG dinamis Mimi dengan 5 tingkatan evolusi bertahap berdasarkan akumulasi streak hari: **Level 1 Biji**, **Level 2 Tunas**, **Level 3 Kuncup**, **Level 4 Mekar**, dan **Level 5 Legenda**.
     - Ekspresi wajah & animasi respon dinamis (*happy, sleepy, excited, sad*) saat Mimi diketuk/disapa, dilengkapi efek partikel cinta & bintang (`♥`, `✦`).
  3. **Pusat Misi Streak & Lembar Evolusi (Mimi Pet Hub Modal):**
     - Ketika maskot Mimi diklik, terbuka dialog interaktif panggung pameran Mimi:
       - **Misi Sehat Harian:** 3 misi kecil terintegrasi CampusFlow (1. Gerak aktif 30 mnt, 2. Istirahat mata 20-20-20, 3. Check-in PSS).
       - **Indikator Progres:** Batang progres menuju level berikutnya, riwayat centang 7 hari mingguan, dan jumlah perlindungan *Streak Freeze*.
       - **Lembar Evolusi (5 Level):** Panel visual lengkap menampilkan wujud, hari terbuka, warna badan, dan keuntungan tiap level Mimi.
       - **Kontrol Uji Coba Cepat (Demo Controls):** Tombol simulasi hari baru (*Simulasi Besok*), *Mulai Ulang*, dan *Loncat Level* untuk mempermudah evaluasi fitur.
- **Daftar File Diubah:**
  - `frontend/src/components/pet/mimiSvg.ts`
  - `frontend/src/components/pet/MimiPetWidget.tsx`
  - `frontend/src/index.css`
  - `frontend/src/App.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (9/9 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-13] — Penyederhanaan Tombol Logout Sidebar Desktop (Hapus Teks Keluar) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.24`
- **Ringkasan:** 
  - Menghapus teks "Keluar →" pada tombol logout di sidebar navigasi desktop (`Navbar.tsx`), menyisakan hanya tombol ikon logout merah pastel yang ringkas, bersih, dan konsisten sesuai permintaan pengguna.
- **Daftar File Diubah:**
  - `frontend/src/components/Navbar.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (9/9 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-12] — Pewarnaan Kartu Modul Kursus Pastel & Penghapusan Teks Hak Cipta Footer (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.23`
- **Ringkasan:** 
  1. **Hapus Teks Hak Cipta pada Footer (Foto 1):** Menghapus baris teks `© 2026 CampusFlow. All rights reserved.` pada footer landing page sehingga tampilan footer lebih bersih dan langsung terfokus pada tombol aksi *"Masuk Dashboard →"*.
  2. **Pewarnaan Kartu Katalog Modul Kursus (Foto 2):**
     - Memberikan palet warna tematik pastel Calorie Counter yang cerah dan estetis pada keempat kartu modul kursus agar tidak tampak polos:
       - **Modul 1 (Ergonomi Postur):** Latar belakang Sky Blue lembut (`bg-[#E6F5F8] border-[#BDE6F0]`) dengan wadah ikon `Eye` bertema visi.
       - **Modul 2 (Aktivitas Fisik & Pedometer):** Latar belakang Mint Green segar (`bg-[#EEF7E6] border-[#CDE8B5]`) dengan wadah ikon `Footprints`.
       - **Modul 3 (Kesehatan Mental & Panic Relief):** Latar belakang Butter Yellow hangat (`bg-[#FFFCEB] border-[#FFE966]`) dengan wadah ikon `Moon`.
       - **Modul 4 (AI Coaching & Habit):** Latar belakang Soft Pink anggun (`bg-[#FDF0F2] border-[#F7A8B0]`) dengan wadah ikon `Bot`.
     - Tombol aksi *"Ikuti Modul →"* didesain kontras dengan warna putih bersih bergaris batas halus (`bg-white hover:bg-[#1A1A1A] hover:text-white border border-black/10 shadow-xs`) dan dorongan horizontal lembut pada panah saat di-hover.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/LandingPage.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (9/9 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-12] — Eliminasi Animasi Hover Melayang Ke Atas pada Button, Emoji, & Badge Status (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.22`
- **Ringkasan:** 
  1. **Tombol "Sign up / Masuk" Landing Page (Foto 1):** Menghilangkan efek `hover:scale-105` yang menyebabkan tombol terangkat/membesar ke atas saat di-hover. Menggantikannya dengan transisi warna halus (`hover:bg-[#B6DF97]`) dan dorongan horizontal lembut pada ikon panah (`group-hover:translate-x-0.5`).
  2. **Emoji Melambai "👋" pada Header Pengguna (Foto 2):** Mengubah interaksi hover pada emoji tangan di `DesktopTopHeader` dan `MobileHeader` menjadi animasi rotasi melambai ke samping (`hover:rotate-12 origin-bottom-right`) tanpa pergeseran sumbu Y/ke atas.
  3. **Badge "MediaPipe 33 Landmark" pada Focus View (Foto 3):** Memastikan badge tetap kokoh di tempatnya tanpa gerakan ke atas, dengan transisi warna latar belakang lembut (`hover:bg-[#BEE1A3] transition-colors`).
  4. **Badge "GPU Acceleration" pada Vision Guard (Foto 4):** Menjaga badge stabil di posisinya tanpa animasi melayang ke atas, menggunakan interaksi hover perubahan warna hijau halus (`hover:bg-[#BEE1A3] transition-colors`).
  5. **Badge "IDLE (1x MET)" pada Pedometer Sensor Card (Foto 5):** Mengunci posisi vertikal badge agar tidak bergeser ke atas saat kursor diarahkan, menggunakan transisi opasitas lembut (`hover:opacity-90 transition-colors`).
- **Daftar File Diubah:**
  - `frontend/src/components/pages/LandingPage.tsx`
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/pages/FocusView.tsx`
  - `frontend/src/components/vision/VisionGuard.tsx`
  - `frontend/src/components/sensor/PedometerCard.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (9/9 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-12] — Refinement Layout Contact & Pembersihan Elemen Landing Page (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.21`
- **Ringkasan:** 
  1. **Hapus Badge Pusat Bantuan pada Contact (Foto 1):** Menghapus pill badge kuning bertuliskan *"Pusat Bantuan & Kolaborasi"* di header seksi Hubungi Tim CampusFlow.
  2. **Rapikan Layout & Card Seksi Contact (Foto 2):**
     - Mengubah grid Contact dari pembagian tidak seimbang (`lg:col-span-7` vs `lg:col-span-5` dengan background berbeda-beda) menjadi tata letak 2-kolom yang seimbang, simetris, dan proporsional (`grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch`).
     - Kolom kiri: Formulir kirim pesan/pengaduan dalam kartu putih bersih (`p-6 sm:p-7 rounded-3xl bg-white border border-[#E8E8E8] shadow-xs`) dengan input yang konsisten dan tombol kirim di bawah.
     - Kolom kanan: Penyatuan kartu saluran dukungan resmi (Email, Hotline, Lab Riset) dan akordion FAQ dalam kartu putih dengan padding dan ketinggian yang selaras dengan kolom kiri.
  3. **Hapus Filter Pills Katalog Modul (Foto 3):** Menghapus barisan tab filter modul (*"Semua Modul"*, *"Ergonomi Postur"*, *"Aktivitas Fisik"*, *"Kesehatan Mental"*) di seksi Courses, menyajikan seluruh modul pembelajaran dalam grid responsif yang bersih.
  4. **Hapus Tagline Branding Panjang pada Footer (Foto 4):** Menghapus baris teks *"CampusFlow • Smart Wellbeing LMS & 24-Hour Movement Behavior"* di bagian footer.
  5. **Hapus Menu Navigasi Footer (Foto 5):** Menghapus deretan tombol link navigasi (*"Beranda"*, *"Courses"*, *"About"*, *"Contact"*) pada footer, menghasilkan tampilan footer yang rapi dan elegan dengan hak cipta di sisi kiri serta tombol aksi *"Masuk Dashboard →"* di sisi kanan.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/LandingPage.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (9/9 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-12] — Penyederhanaan Visual Landing Page (Hapus Badge, Rating, Banner, & Card Garansi) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.20`
- **Ringkasan:** 
  1. **Hapus Badge Kategori & XP pada Kartu Kursus (Foto 1):** Menghapus baris badge kategori (`c.categoryLabel`) dan poin XP (`c.xp`) di bagian atas kartu modul kursus (`media_1794491228298_8ebce514.png`).
  2. **Hapus Durasi & Rating Modul Kursus (Foto 2):** Menghapus informasi waktu (`3 Minggu`) dan skor bintang rating (`⭐ 4.9`) pada footer kartu kursus (`media_1794491284529_2109934f.png`), sehingga menyisakan tombol aksi *"Ikuti Modul →"* yang tersusun rapi.
  3. **Hapus Badge Header About (Foto 3):** Menghapus pill badge bertuliskan *"TENTANG CAMPUSFLOW"* di bagian atas judul seksi About (`media_1794491312390_9be71acc.png`).
  4. **Hapus Banner Promosi Bawah Courses (Foto 4):** Menghapus kartu banner hijau *"Semua kursus terbuka gratis untuk mahasiswa aktif"* di akhir seksi katalog kursus (`media_1794491335277_08cda176.png`).
  5. **Hapus Card Garansi Privasi Bawah About (Foto 5):** Menghapus kartu jaminan *"Garansi 100% On-Device Edge Privacy (Zero Video Upload)"* beserta metrik dampak di akhir seksi About (`media_1794491360340_7946dcdb.png`).
- **Daftar File Diubah:**
  - `frontend/src/components/pages/LandingPage.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (9/9 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-12] — Navbar Fixed Menempel di Atas Layar & Penghapusan Dot Pagination Hero Carousel (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.19`
- **Ringkasan:** 
  1. **Navbar Fixed Menempel di Atas (Foto 1):**
     - Mengubah posisi `<header>` navigasi utama menjadi menempel di tepi paling atas layar (*edge-to-edge*) secara permanen menggunakan `fixed top-0 left-0 right-0 z-50` seperti standar navbar web modern.
     - Menggunakan efek kaca transparan halus `bg-white/95 backdrop-blur-md border-b border-[#E8E8E8] shadow-xs`.
     - Memberikan offset `pt-20 sm:pt-24` pada area konten utama agar tidak tertutup navbar fixed.
     - Menyusun menu dropdown mobile menempel langsung tepat di bawah navbar fixed (`fixed top-[61px] left-0 right-0 z-40`).
  2. **Penghapusan Dot Pagination Carousel (Foto 2):**
     - Menghapus elemen indikator dot / pill pagination carousel (`● ● ▬`) di bawah headline seksi Hero sesuai tangkapan layar `media_1794491156668_484e4005.png`.
     - Slider teks judul 3 variasi tetap berjalan otomatis secara mulus setiap 4 detik dengan transisi animasi slide ke samping.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/LandingPage.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (9/9 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-12] — Penyatuan Seluruh Bagian Landing Page Menjadi Satu Halaman Tunggal Terintegrasi (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.18`
- **Ringkasan:** 
  1. **Penyatuan Halaman Tunggal (Single-Page Seamless Layout):**
     - Mengubah arsitektur tampilan Landing Page dari sistem pergantian tab terpisah menjadi **satu halaman utuh yang mengalir berkelanjutan** dari atas ke bawah.
     - Menyusun seluruh seksi secara berurutan: `#home` (Hero Carousel & Maskot Ilustrasi AI), `#courses` (Katalog Modul Ergonomi & Wellbeing), `#about` (Tentang CampusFlow, 3 Pilar Triad, & Jaminan Zero Video Upload), dan `#contact` (Formulir Pengaduan/Pesan, Saluran Dukungan Resmi, & Akordion FAQ).
  2. **Navigasi Cerdas & ScrollSpy:**
     - Bilah navigasi atas (Desktop & Mobile) dibuat tetap menempel (*sticky header*) dengan efek blur `backdrop-blur-md`.
     - Mengimplementasikan `IntersectionObserver` (ScrollSpy) sehingga saat pengguna menggulir halaman, pill kuning aktif (`#FFF29A`) pada navbar otomatis mengidentifikasi dan menyorot posisi seksi yang sedang dilihat.
     - Mengarahkan klik pada tautan menu (HOME, COURSES, ABOUT, CONTACT) langsung melakukan gulir halus (*smooth scroll into view*) dengan offset margin `scroll-mt-24` agar judul seksi tidak tertutup navbar.
  3. **Footer Terintegrasi:**
     - Menyatukan footer informatif di bagian akhir halaman dengan tautan cepat kembali ke masing-masing seksi serta tombol masuk langsung ke Dashboard.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/LandingPage.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (9/9 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-12] — Kelengkapan Konten Halaman Courses, About, & Contact pada Landing Page (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.17`
- **Ringkasan:** 
  1. **Halaman Courses (`courses`):**
     - Membangun katalog 4 modul pembelajaran wellbeing dan ergonomi terpadu (*Ergonomi Belajar 20-20-20*, *24-Hour Movement & Pedometer*, *Regulasi Stres & Panic Relief 15 Menit*, dan *AI Coach & Habit Loop*).
     - Menghadirkan sistem filter kategori modul (*Semua Modul*, *Ergonomi Postur*, *Aktivitas Fisik*, *Kesehatan Mental*).
     - Menampilkan rating, durasi modul, jumlah mahasiswa terdaftar, alokasi poin XP, dan tombol pendaftaran langsung menuju aplikasi.
  2. **Halaman About (`about`):**
     - Menjelaskan visi dan filosofi CampusFlow sebagai platform pelopor Smart Wellbeing LMS mahasiswa.
     - Menyajikan 3 pilar utama Triad CampusFlow (*Postur AI MediaPipe*, *Gerak Aktif Inersia METs*, dan *Regulasi Stres PSS-4*).
     - Menegaskan komitmen perlindungan data *Zero Video Upload Guarantee* (100% on-device WebGL/WASM) serta statistik dampak klinis (*-42% nyeri leher, 1500+ METs mingguan*).
  3. **Halaman Contact (`contact`):**
     - Membangun formulir kontak interaktif (Nama, Email, Kategori Pertanyaan, Uraian Pesan) dengan feedback animasi pengiriman sukses.
     - Menampilkan saluran resmi pendukung (Email, Hotline Mahasiswa, Lokasi Lab Riset).
     - Menyediakan panel akordion FAQ (*Frequently Asked Questions*) seputar privasi kamera, cara kerja sensor akselerometer, dan integrasi SSO kampus.
  4. **Interaktivitas Navigasi:**
     - Navbar desktop dan mobile kini mendukung pergantian halaman instan (*Home, Courses, About, Contact*) dengan pill Butter Yellow aktif `#FFF29A`.
     - Footer dinamis yang menampilkan tombol kembali ke beranda saat berada di halaman sekunder dan navigasi cepat ke dashboard.
- **Daftar File Diubah:**
  - `frontend/src/components/pages/LandingPage.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (9/9 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-12] — Penghapusan Tombol Logout Top Header & Halaman Atur Profil Pengguna (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.16`
- **Ringkasan:** 
  1. **Hapus Tombol Logout Top Header (Gambar 1):** Menghapus tombol logout pill yang berada di header atas desktop (`DesktopTopHeader`) sesuai tangkapan layar `media_1794488419546_2f780a2d.png`. Tombol keluar akun tetap tersedia secara terorganisir di bagian bawah desktop sidebar dan dropdown avatar mobile.
  2. **Halaman Atur Profil Pengguna (`ProfileView.tsx`):**
     - Membangun halaman baru `ProfileView.tsx` untuk mengelola data identitas mahasiswa (Nama Lengkap, NIM, Email, Program Studi, Semester).
     - Menghadirkan kustomisasi warna latar avatar pastel (Soft Pink `#F7A8B0`, Sky Blue `#BDE6F0`, Mint Green `#CDE8B5`, Butter Yellow `#FFF29A`, Lavender `#C9B3E6`).
     - Menyediakan panel target METs mingguan (dengan slider interaktif dan preset IPAQ-SF 600 - 2000 METs), durasi fokus duduk sebelum jeda (45/50/60 mnt), serta target tidur harian.
     - Menampilkan kartu ringkasan gamifikasi (Streak aktif, Level 4 Habit Champion, XP terkumpul) dan status kalibrasi postur AI (*Vision Baseline*) dengan shortcut langsung menuju Vision Focus.
     - Menyediakan tombol simpan profil yang langsung memperbarui state global dan tersimpan secara persisten di `localStorage`/API.
  3. **Akses Navigasi Profil:**
     - Tombol profil/avatar di `DesktopTopHeader` dan snippet profil di bawah `DesktopSidebar` kini dapat diklik untuk membuka halaman Atur Profil.
     - Ditambahkan item "Atur Profil" pada dropdown profil di `MobileHeader`.
     - Ditambahkan shortcut navigasi dari `SettingsView.tsx` menuju `ProfileView.tsx`.
- **Daftar File Diubah:**
  - `frontend/src/types/index.ts`
  - `frontend/src/lib/api.ts`
  - `frontend/src/components/pages/ProfileView.tsx` (baru)
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/pages/SettingsView.tsx`
  - `frontend/src/App.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos (0 TypeScript errors).
  - `npm run test:frontend` (9/9 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-12] — Tombol Logout Sidebar & Animasi Bouncing Navbar Bottom Mobile (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.15`
- **Ringkasan:** 
  1. **Tombol Logout (Gambar 1):** Mengubah tombol navigasi di bagian bawah sidebar desktop (`DesktopSidebar`) yang sebelumnya bertuliskan "Landing Page" menjadi tombol **"Log out" / "Keluar"** berikon `LogOut` dengan hover state warna merah lembut (`hover:bg-rose-50/70 hover:text-rose-600`), serta menyelaraskan tombol keluar pada header atas desktop dan dropdown avatar pengguna di mobile.
  2. **Animasi Bouncing Pill Navbar Bawah Mobile (Gambar 2):** Mengubah perpindahan indikator aktif kuning (`#FFF29A`) pada `MobileBottomNav` menjadi sliding pill dinamis dengan transisi fisika pegas *overshoot* `cubic-bezier(0.34, 1.56, 0.64, 1)` dan efek memantul kenyal (*squash & stretch bounce*) melalui keyframe `@keyframes navPillBounce` (`.animate-nav-bounce`) setiap kali berpindah tab menu, disertai animasi ikon terangkat halus (`scale-110 -translate-y-0.5`).
- **Daftar File Diubah:**
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/index.css`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (9/9 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-12] — Transformasi Palet Warna Calorie Counter Pastel (Sky Blue, Mint Green, Butter Yellow, Peach, Soft Pink, Cloud Gray, & Ink Black) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.6`
- **Ringkasan:** 
  1. Menerapkan palet warna pastel segar dan ramah berbasis desain Calorie Counter Mobile App dengan proporsi 60-30-10:
     - **Warna Utama:** Sky Blue `#BDE6F0` (Kartu "Your Progress", Water, Taco), Mint Green `#CDE8B5` (Kartu Breakfast, bar nutrisi/kebugaran), Butter Yellow `#FFF29A` (Tombol aksi "Calorie count", item navigasi aktif).
     - **Warna Pendukung:** Peach Orange `#F9B99A` (Ring progres 72%, ikon streak), Soft Pink `#F7A8B0` (Badge notifikasi, latar avatar), Lavender `#C9B3E6` (Indikator tag kecil).
     - **Warna Netral:** Pure White `#FFFFFF` (Latar kartu & lingkaran angka), Cloud Gray `#F6F6F6` (Latar layar, kartu netral, track bar), Light Gray `#E8E8E8` (Border halus kartu), Ink Black `#1A1A1A` (Teks utama & angka besar), Muted Gray `#9A9A9A` (Teks sekunder).
  2. Memperbarui `tailwind.config.js` dengan token warna `sky`, `mint`, `butter`, `peach`, `softPink`, `lavender`, `cloud`, `ink`, `muted`.
  3. Menyelaraskan seluruh komponen antarmuka (`App.tsx`, `Navbar.tsx`, `TriadDashboard.tsx`, `PanicReliefMode.tsx`, `StatusPill.tsx`, `ActivityView.tsx`, `CheckinView.tsx`, `CoachView.tsx`, `HistoryView.tsx`, `SettingsView.tsx`, `FocusView.tsx`, `VisionLabView.tsx`, `PedometerCard.tsx`, `VisionGuard.tsx`).
- **Daftar File Diubah:**
  - `frontend/tailwind.config.js`
  - `frontend/src/index.css`
  - `frontend/src/App.tsx`
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/TriadDashboard.tsx`
  - `frontend/src/components/PanicReliefMode.tsx`
  - `frontend/src/components/common/StatusPill.tsx`
  - `frontend/src/components/pages/ActivityView.tsx`
  - `frontend/src/components/pages/CheckinView.tsx`
  - `frontend/src/components/pages/CoachView.tsx`
  - `frontend/src/components/pages/HistoryView.tsx`
  - `frontend/src/components/pages/SettingsView.tsx`
  - `frontend/src/components/pages/FocusView.tsx`
  - `frontend/src/components/pages/VisionLabView.tsx`
  - `frontend/src/components/sensor/PedometerCard.tsx`
  - `frontend/src/components/vision/VisionGuard.tsx`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos (0 TypeScript errors).
  - `npm run test:frontend` (8/8 tests pass).
  - `npm run test:shared` (5/5 tests pass).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-12] — Penerapan Palet Warna Kustom: F2EFE7 (Background), 3368A0 (Font), 66A3BF & C8DFDB (Komponen Pendukung & Cards) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.5`
- **Ringkasan:** 
  1. Mengganti seluruh palet warna aplikasi CampusFlow sesuai instruksi spesifik pengguna dan referensi 4 warna:
     - `#F2EFE7`: Warna dasar primary untuk background aplikasi (`surface`, `body`, scrollbar track).
     - `#3368A0`: Warna font utama (teks, headings, brand logos, primary button, icon containers, active menu pill).
     - `#66A3BF`: Komponen pendukung (aksen sekunder, tombol interaktif, chart lines, icon accents, streak gradient).
     - `#C8DFDB`: Komponen pendukung & cards (card borders, soft badge fills, pill containers, circular progress tracks).
  2. Memperbarui `tailwind.config.js` dengan token `primary`, `ocean` (`#3368A0`), `cerulean` (`#66A3BF`), `seafoam` (`#C8DFDB`), `cream` (`#F2EFE7`), dan bayangan bertema ocean tint.
  3. Mengadaptasi seluruh view dan komponen (`App.tsx`, `Navbar.tsx`, `TriadDashboard.tsx`, `PanicReliefMode.tsx`, `StatusPill.tsx`, `ActivityView.tsx`, `CheckinView.tsx`, `CoachView.tsx`, `HistoryView.tsx`, `SettingsView.tsx`, `FocusView.tsx`, `VisionLabView.tsx`, `PedometerCard.tsx`, `VisionGuard.tsx`).
- **Daftar File Diubah:**
  - `frontend/tailwind.config.js`
  - `frontend/src/index.css`
  - `frontend/src/App.tsx`
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/TriadDashboard.tsx`
  - `frontend/src/components/PanicReliefMode.tsx`
  - `frontend/src/components/common/StatusPill.tsx`
  - `frontend/src/components/pages/ActivityView.tsx`
  - `frontend/src/components/pages/CheckinView.tsx`
  - `frontend/src/components/pages/CoachView.tsx`
  - `frontend/src/components/pages/HistoryView.tsx`
  - `frontend/src/components/pages/SettingsView.tsx`
  - `frontend/src/components/pages/FocusView.tsx`
  - `frontend/src/components/pages/VisionLabView.tsx`
  - `frontend/src/components/sensor/PedometerCard.tsx`
  - `frontend/src/components/vision/VisionGuard.tsx`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos (0 TypeScript errors).
  - `npm run test:frontend` (8/8 tests pass).
  - `npm run test:shared` (5/5 tests pass).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-12] — Redesain Komprehensif Antarmuka Web (Desktop & Mobile) Bergaya Learnova LMS & Perbaikan Vision Lab (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.3`, `FE-1.4`, `FE-2.1`
- **Ringkasan:** 
  1. Merombak visual style dan palet warna seluruh aplikasi CampusFlow mengadopsi referensi Learnova LMS: background `#F8F9FE`, card putih bersih rounded-2xl/3xl dengan soft shadow, aksen utama royal indigo `#5046E5`, aksen pastel (mint, amber, soft rose), dan dark purple celebratory cards.
  2. Implementasi layout Desktop: Fixed sidebar kiri dengan navigasi menu berlatar lavender untuk status aktif, header sapaan personal "Good Morning, [Name] 👋" disertai search bar rounded pill & notification counter, grid metrik 4 kartu, 24-Hour Movement donut progress (72%), purple streak card, dan area chart Recharts.
  3. Implementasi layout Mobile: Header ringkas "Hi, [Name] 👋", hero purple banner dengan play button, horizontal date strip selector, card list rapi, dan bottom navigation bar 5 tab tetap.
  4. Redesain seluruh view halaman (`TriadDashboard`, `ActivityView`, `CheckinView`, `CoachView`, `HistoryView`, `SettingsView`, `FocusView`, `VisionLabView`, `PanicReliefMode`, `PedometerCard`, `StatusPill`).
  5. Perbaikan Vision Lab: Penyediaan model offline MediaPipe `pose_landmarker_lite.task` dan wasm binary di `public/`, toleransi visibility kalibrasi (`MIN_CALIBRATION_VISIBILITY = 0.35`), serta proteksi `try...finally` pada frame loop requestAnimationFrame.
- **Daftar File Diubah:**
  - `frontend/tailwind.config.js`
  - `frontend/src/index.css`
  - `frontend/src/App.tsx`
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/TriadDashboard.tsx`
  - `frontend/src/components/PanicReliefMode.tsx`
  - `frontend/src/components/common/StatusPill.tsx`
  - `frontend/src/components/pages/ActivityView.tsx`
  - `frontend/src/components/pages/CheckinView.tsx`
  - `frontend/src/components/pages/CoachView.tsx`
  - `frontend/src/components/pages/HistoryView.tsx`
  - `frontend/src/components/pages/SettingsView.tsx`
  - `frontend/src/components/pages/FocusView.tsx`
  - `frontend/src/components/pages/VisionLabView.tsx`
  - `frontend/src/components/sensor/PedometerCard.tsx`
  - `frontend/src/components/vision/VisionGuard.tsx`
  - `frontend/src/utils/poseHeuristics.ts`
  - `frontend/public/models/pose_landmarker_lite.task`
  - `frontend/public/wasm/*`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos (0 TypeScript errors, PWA service worker generated).
  - `npm run test:frontend` (8/8 tests pass).
  - `npm run test:shared` (5/5 tests pass).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-11] — Inisialisasi Proyek React 18, Vite, Tailwind CSS, & Layer Mock (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.1`, `FE-1.2`
- **Ringkasan:** Menginisialisasi fondasi frontend React 18 + Vite + TypeScript + Tailwind CSS + PWA (Workbox autoUpdate), konfigurasi token desain (Poppins, Inter, palet resmi), navigasi responsif, komponen TriadDashboard, Exam Panic Relief Mode, serta layer API Mock (`VITE_USE_MOCK=true`) berbasis `MOCK_DATA.md`.
- **Daftar File Diubah:**
  - `frontend/package.json`
  - `frontend/package-lock.json`
  - `frontend/vite.config.ts`
  - `frontend/tailwind.config.js`
  - `frontend/postcss.config.js`
  - `frontend/tsconfig.json`
  - `frontend/tsconfig.node.json`
  - `frontend/index.html`
  - `frontend/public/manifest.webmanifest`
  - `frontend/public/favicon.svg`
  - `frontend/src/index.css`
  - `frontend/src/main.tsx`
  - `frontend/src/App.tsx`
  - `frontend/src/vite-env.d.ts`
  - `frontend/src/types/index.ts`
  - `frontend/src/lib/api.ts`
  - `frontend/src/mocks/campusflowMock.ts`
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/TriadDashboard.tsx`
  - `frontend/src/components/PanicReliefMode.tsx`
  - `frontend/src/components/common/StatusPill.tsx`
  - `frontend/src/components/pages/FocusView.tsx`
  - `frontend/src/components/pages/ActivityView.tsx`
  - `frontend/src/components/pages/CheckinView.tsx`
  - `frontend/src/components/pages/CoachView.tsx`
  - `frontend/src/components/pages/HistoryView.tsx`
  - `frontend/src/components/pages/SettingsView.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** `npm --prefix frontend run build` berhasil tanpa error TypeScript (PWA precache generated).

## [2026-11-11] — Baseline Awal Branch Frontend dari `main` (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-0.0`
- **Ringkasan:** Menerima turunan fondasi arsitektur, design system, kontrak API, dan dokumen tugas dari `main`. Siap untuk inisialisasi aplikasi React 18 + Vite + Tailwind + PWA di direktori `frontend/`.
- **Verifikasi:** Sinkron dengan commit dasar `main`.
