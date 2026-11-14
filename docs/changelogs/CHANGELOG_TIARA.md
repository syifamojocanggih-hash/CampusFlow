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
