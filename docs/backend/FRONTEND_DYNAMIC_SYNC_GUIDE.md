# Panduan Penghapusan Data Dummy Frontend & Integrasi Penuh ke Database MySQL

> **Status:** Siap dieksekusi di branch `main` setelah branch `backend` di-merge.  
> **Tujuan:** Menghapus seluruh data contoh (*hardcoded dummy data*) pada halaman-halaman frontend sehingga setiap pengguna baru benar-benar mulai dari kondisi kosong (`0`) dan seluruh halaman membaca/menulis data asli dari backend MySQL.

---

## 1. Endpoint Backend yang Sudah Siap Dipakai (MySQL Live)

Seluruh endpoint berikut sudah aktif, terhubung penuh ke MySQL, dan lulus 133/133 automated test di branch `backend`:

| Fitur | Endpoint Backend | Keterangan |
| :--- | :--- | :--- |
| **Ringkasan Harian Terpadu** | `GET /api/v1/dashboard/daily-summary` | Mengembalikan profil, jadwal hari ini, burnout index, tidur, screen time, langkah/MVPA, active breaks, check-in, dan jumlah notifikasi belum dibaca. |
| **Notifikasi Harian Dinamis** | `GET /api/v1/notifications` | Membaca tabel `UserNotification` di MySQL; otomatis men-generate pengingat kontekstual harian jika belum ada. |
| **Tandai / Hapus Notifikasi** | `PATCH /api/v1/notifications/:id/read`, `PATCH /api/v1/notifications/read-all`, `DELETE /api/v1/notifications/:id` | Menyimpan status baca & penghapusan notifikasi langsung ke MySQL. |
| **Riwayat Sesi Fokus / Duduk** | `GET /api/v1/sedentary/sessions`, `POST /api/v1/sedentary/sessions` | Menyimpan sesi fokus/duduk ke MySQL sekaligus memperbarui `DailyFussionLog` & Burnout Index. |
| **Burnout Index Terkalibrasi** | `GET /api/v1/burnout/today`, `GET /api/v1/burnout/history?days=14` | Skala 0–100 terkalibrasi (Academic + Screen + Sleep Deficit − Active Break & Sleep Bonus). |
| **Sync Screen Time Per-User** | `GET /api/v1/os-lock/screentime`, `POST /api/v1/os-lock/screentime/sync` | Kirim header `Authorization: Bearer <token>` agar waktu layar otomatis tersimpan ke `DailyFussionLog` user di MySQL. |

---

## 2. Daftar Halaman Frontend yang Perlu Dibersihkan di Branch `main`

### A. Workstation & Jeda (`frontend/src/components/pages/FocusView.tsx`)
- **Masalah saat ini:**
  - `INITIAL_TASKS` berisi 3 tugas dummy (*Basis Data*, *Kecerdasan Buatan*, *Pemrograman Web*).
  - `COMPLETED_SESSIONS` berisi 5 riwayat sesi belajar palsu (`08:30`, `09:10`, `10:00`, dst.).
  - `completedBouts` dimulai dari `5` (langsung tampil *Sesi Fokus ke-6*).
  - `secondsRemaining` dimulai dari `18:42` dengan `isTimerRunning = true` (timer jalan sendiri sebelum diklik Mulai).
- **Perbaikan yang harus dilakukan:**
  1. Kosongkan `INITIAL_TASKS` menjadi `[]` (atau baca dari `localStorage` per-user `cf_focus_tasks_<userId>`).
  2. Hapus konstanta `COMPLETED_SESSIONS` dan ambil riwayat sesi hari ini dari `GET /api/v1/sedentary/sessions?days=1` (saat sesi timer selesai, kirim `POST /api/v1/sedentary/sessions` ke MySQL).
  3. Ubah state awal: `completedBouts = 0` (diisi dari jumlah sesi hari ini dari DB), `secondsRemaining = sessionDurationMins * 60` (`25:00`), dan `isTimerRunning = false`.

### B. Popover Notifikasi (`frontend/src/components/notifications/NotificationPopover.tsx`)
- **Masalah saat ini:**
  - Menggunakan `INITIAL_NOTIFICATIONS` hardcoded (4 notifikasi dummy: *"Tidur semalam 6.5 jam"*, *"Streak 5 hari"*, *"UAS IMK 3 hari lagi"*).
- **Perbaikan yang harus dilakukan:**
  1. Hapus `INITIAL_NOTIFICATIONS` dan ganti dengan pemanggilan API `GET /api/v1/notifications`.
  2. Hubungkan tombol tandai dibaca ke `PATCH /api/v1/notifications/:id/read` dan tombol hapus ke `DELETE /api/v1/notifications/:id`.
  3. Sinkronkan `unreadCount` langsung dari `res.data.unreadCount`.

### C. Halaman Riwayat (`frontend/src/components/pages/HistoryView.tsx`)
- **Masalah saat ini:**
  - 4 lencana *Achievements* (`Early Bird`, `Streak Master`, `Active Stretcher`, `Sleep Protector`) masih statis dan selalu tampil seolah sudah diraih.
  - Fallback catch API masih memuat `MOCK_TRIAD_DASHBOARD.data.history`.
- **Perbaikan yang harus dilakukan:**
  1. Hitung status *unlocked/locked* tiap lencana secara dinamis dari data nyata (`weeklySummary.currentStreakDays`, `verifiedBreakCount`, rata-rata `sleepHours` dari `history`).
  2. Saat API kosong, tampilkan *empty state* bersih (jangan menampilkan `MOCK_TRIAD_DASHBOARD`).

### D. Halaman AI Coach (`frontend/src/components/pages/CoachView.tsx`)
- **Masalah saat ini:**
  - Kartu *"Sedikit lebih baik, hari ini"* (poin `01`, `02`, `03`) masih menggunakan teks statis (*"Tambah 2 jam untuk capai target"* meskipun jam tidur user sudah ≥ 8 jam).
- **Perbaikan yang harus dilakukan:**
  1. Hitung rekomendasi 3 langkah secara dinamis berdasarkan `autoSleep.sleepHours`, `screenHours`, dan `verifiedBreakCount` (dari `GET /api/v1/dashboard/daily-summary`).

### E. Check-in Harian (`frontend/src/components/pages/CheckinView.tsx`)
- **Perbaikan minor:**
  1. Ubah nilai awal `screenHours` dari hardcoded `4` menjadi nilai live `screenTimeTracker.getTodayScreenTimeHours()`.

---

## 3. Cara Eksekusi Cepat di Branch `main`

Setelah branch `backend` (dan `frontend`) di-merge ke `main`, Anda cukup pindah ke branch `main` lalu kirimkan prompt singkat ini ke AI Assistant:

> *"Ikuti panduan di `docs/backend/FRONTEND_DYNAMIC_SYNC_GUIDE.md` dan terapkan seluruh pembersihan data dummy pada `FocusView.tsx`, `NotificationPopover.tsx`, `HistoryView.tsx`, `CoachView.tsx`, dan `CheckinView.tsx` agar 100% dinamis tersambung ke backend MySQL, lalu verifikasi build & test."*
