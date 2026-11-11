# PAGES_AND_FLOWS.md — Sitemap 10 Layar & Alur Pengguna

> **PENANGGUNG JAWAB:** Tiara (`@mutiaradewanda` — branch `frontend`)

---

## 1. Sitemap 10 Layar Utama

| No | Halaman / Layar | Rute Disarankan | Fungsi Utama untuk Pengguna |
|---|---|---|---|
| 1 | **Onboarding & Login** | `/login`, `/register` | Registrasi dengan NIM, profil singkat, login demo (`demo@campusflow.id`), serta persetujuan izin kamera & sensor gerak. |
| 2 | **Kalibrasi Postur (5 Detik)** | `/calibrate` | Wajib sebelum sesi belajar pertama; merekam 100 frame duduk tegak dan menyimpan `PostureBaseline`. |
| 3 | **Dashboard Harian (`TriadDashboard`)** | `/` *(Dashboard)* | Ringkasan 3 pilar hari ini: menit duduk, langkah/MET, skor stres PSS-4 dengan *Status Pill* + tombol **Exam Panic Button**. |
| 4 | **Sesi Belajar Aktif (`VisionGuard`)** | `/focus` | Mode fokus dengan webcam aktif (layar lebar); menampilkan overlay skeleton, metrik postur, dan toast peringatan lembut. |
| 5 | **Active Break Modal** | *(Overlay di `/focus`)* | Layar kunci peregangan anti-cheat saat waktu duduk melewati ambang batas (50 menit / 15 detik pada `DEMO_MODE`). |
| 6 | **Pelacak Aktivitas Fisik (Mobile)** | `/activity` | `PedometerCard` dengan Progress Ring MET harian, cadence SPM live, plus form input manual/MSE untuk desktop. |
| 7 | **Kuesioner Harian / Mingguan** | `/checkin` | Input cepat PSS-4 + tidur harian (30 detik) dan evaluasi mingguan PSS-10. |
| 8 | **AI Coach** | `/coach` | Rekomendasi aksi fisik personal dari Gemini 2.5 Flash berbasis data 7 hari terakhir + sitasi ilmiah & tombol aksi selesai. |
| 9 | **Riwayat & Statistik** | `/history` | Grafik tren mingguan/bulanan (Recharts) untuk 3 pilar, riwayat sesi duduk, streak, & XP. |
| 10 | **Pengaturan** | `/settings` | Kelola izin kamera/sensor, notifikasi Web Push, target MET mingguan, privasi data, & toggle `DEMO_MODE`. |

---

## 2. Alur Utama Pengguna (User Flows)

### Alur A — Sesi Belajar Laptop & Active Break Anti-Cheat
```
[ Login / Demo ] ─► [ Kalibrasi 5 Detik ] ─► [ Sesi Belajar VisionGuard ]
                                                       │
       ┌── (Membungkuk >=3 mnt) ─► [ Toast Kuning Halus ]
       │
       └── (Duduk >=50 mnt / DEMO 15 dtk) ─► [ ActiveBreakModal Mengunci Layar ]
                                                       │
                                      [ 3x Overhead Stretch + Berdiri ]
                                                       │
                                                       ▼
                                         [ Kunci Terbuka & Reset Timer ]
```

### Alur B — Aktivitas Kampus di Smartphone + AI Coach
```
[ Buka PWA di HP (HTTPS) ] ─► [ Klik "Aktifkan Pelacak Langkah" ] ─► [ Berjalan di Kampus ]
                                                                             │
[ Lihat Rekomendasi AI Coach ] ◄─ [ Isi PSS-4 + Jam Tidur ] ◄─ [ Sinkronisasi METs ]
```

---

## 3. Penanganan Fallback (Graceful Degradation)

| Kondisi Perangkat / Lingkungan | Perilaku UI Frontend |
|---|---|
| Pengguna menolak izin kamera | Nonaktifkan `VisionGuard` dengan pesan informatif; arahkan ke Pedometer & Kuesioner (bukan error screen). |
| Layar HP `< 640px` atau tanpa webcam | Sembunyikan komponen kamera postur; tampilkan ringkasan waktu duduk manual & utamakan `PedometerCard`. |
| Browser desktop tanpa `DeviceMotionEvent` | Nonaktifkan sensor otomatis; tampilkan form *Manual Activity Log* (Jalan/Moderate/Vigorous/MSE). |
| Internet terputus saat sesi berjalan | Simpan log sementara ke LocalStorage/IndexedDB dan tampilkan badge *"Mode Offline — Menunggu Sinkronisasi"*. |
