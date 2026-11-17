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
