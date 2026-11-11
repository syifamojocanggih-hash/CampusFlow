# DESIGN_SYSTEM.md — Spesifikasi Desain UI/UX & Visual CampusFlow

> **PENANGGUNG JAWAB:** Tiara (`@mutiaradewanda` — branch `frontend`)

---

## 1. Prinsip Desain Utama

1. **Calm & Supportif:** Karena ditujukan untuk mengelola stres dan kesehatan mental mahasiswa, antarmuka menghindari warna agresif (merah menyala penuh layar atau kontras yang memicu panik) untuk notifikasi non-darurat.
2. **Low Cognitive Load:** Satu layar = satu fokus tindakan utama. Dashboard memakai kartu besar dengan *Status Pill* warna yang mudah dipindai sekilas, bukan tabel angka mentah yang padat.
3. **Mobile-first, Desktop-enhanced:** Fitur kamera postur (`VisionGuard`) dioptimalkan untuk layar lebar laptop (`> 1024px`), sedangkan `PedometerCard` dan pengisian kuesioner cepat dioptimalkan untuk layar sempit smartphone (`< 640px`).

---

## 2. Palet Warna Resmi

| Token | Hex | Penggunaan | Contoh Tailwind |
|---|---|---|---|
| **Primary** | `#2563EB` | Tombol utama, navigasi aktif, grafik pilar gerak | `bg-[#2563EB]` / `text-blue-600` |
| **Secondary / Calm** | `#0EA5A4` | Aksen pilar tidur, ketenangan, & mode pernapasan/relaksasi | `bg-[#0EA5A4]` / `text-teal-600` |
| **Success** | `#22C55E` | Status `'Optimal'` pada Triad Dashboard & validasi gerak | `bg-green-50 text-green-700 border-green-200` |
| **Warning** | `#F59E0B` | Status `'Waspada'` (stres sedang, mulai membungkuk) | `bg-amber-50 text-amber-700 border-amber-200` |
| **Danger (Lembut)** | `#EF4444` | Status `'Tinggi'` — **dipakai minim** (hanya teks/ikon kecil, bukan blok penuh) | `text-red-500` / `bg-red-50 text-red-700` |
| **Background** | `#F8FAFC` | Latar utama aplikasi (light mode tenang) | `bg-[#F8FAFC]` |
| **Text Primary** | `#1E293B` | Teks isi utama berkejelasan tinggi | `text-[#1E293B]` |

*(Catatan tambahan untuk overlay skeleton kamera saat gerakan Active Break terverifikasi valid: hijau `#10B981`).*

---

## 3. Tipografi & Skala Ukuran

- **Heading:** `Poppins` (SemiBold `600`) — untuk judul kartu, skor utama, dan header halaman.
- **Body & Angka Sensor:** `Inter` (Regular `400` / Medium `500`) — menjaga kestabilan keterbacaan pada angka sensor langkah/postur yang bergerak cepat (`tabular-nums`).
- **Skala Ukuran:** `12px` / `14px` / `16px` / `20px` / `28px` mengikuti skala standar Tailwind (`text-xs`, `text-sm`, `text-base`, `text-xl`, `text-2xl`).

---

## 4. Komponen Kunci

1. **Status Pill:** Lencana indikator singkat bertuliskan **Optimal** / **Waspada** / **Tinggi** lengkap dengan ikon penanda agar ramah buta warna; dipakai seragam di Triad Dashboard, Sesi Belajar, dan Riwayat.
2. **Progress Ring:** Lingkaran progres pencapaian MET harian/mingguan terhadap target, dipakai pada `PedometerCard`.
3. **Toast Halus & Border Peringatan:** Peringatan postur saat sesi belajar tampil sebagai border lembut berwarna amber di sekeliling preview kamera + toast kecil di pojok agar tidak memutus alur belajar (berbeda dari **Active Break Modal** yang memang mengunci layar saat waktu duduk terlampaui).

---

## 5. Breakpoint Responsif & Target Performa

| Breakpoint (Tailwind) | Target Perangkat | Penyesuaian Layout |
|---|---|---|
| `< 640px` (`sm`) | Smartphone | Dashboard 1 kolom; fitur kamera postur disembunyikan/diganti ringkasan teks; fokus pada `PedometerCard` & kuesioner 30 detik. |
| `640–1024px` (`md`) | Tablet | Dashboard 2 kolom; `VisionGuard` opsional bila perangkat memiliki kamera depan stabil. |
| `> 1024px` (`lg`) | Laptop | Layout penuh 3 kolom: `VisionGuard` + `TriadDashboard` + `AI Coach` berdampingan (*side-by-side*). |

**Target Performa:**
- *First Contentful Paint* `< 2.5 detik` pada koneksi 4G sedang.
- Lazy-load `VisionGuard` dan `Recharts` agar bundle awal tetap ringan.
- Ikon 100% dari `lucide-react` (lisensi open-source).
