import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  BookOpen,
  Hash,
  Flame,
  Award,
  Target,
  Save,
  RotateCcw,
  Eye,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import type { UserProfileDTO } from "@/types";

interface ProfileViewProps {
  currentUser: UserProfileDTO | null;
  onProfileUpdated?: (updated: UserProfileDTO) => void;
  onNavigateToFocus?: () => void;
}

const AVATAR_BG_COLORS = [
  { name: "Soft Pink", hex: "#F7A8B0" },
  { name: "Sky Blue", hex: "#BDE6F0" },
  { name: "Mint Green", hex: "#CDE8B5" },
  { name: "Butter Yellow", hex: "#FFF29A" },
  { name: "Lavender", hex: "#C9B3E6" },
];

const DEPARTMENTS = [
  "Teknik Informatika",
  "Sistem Informasi",
  "Teknik Komputer",
  "Teknik Elektro",
  "Ilmu Komunikasi",
  "Manajemen Bisnis",
  "Desain Komunikasi Visual",
];

const MET_PRESETS = [
  { label: "Dasar (600)", value: 600, desc: "Aktivitas ringan harian" },
  { label: "Moderat (1200)", value: 1200, desc: "Sesuai standar minimal WHO" },
  { label: "Optimal (1500)", value: 1500, desc: "Rekomendasi mahasiswa aktif" },
  { label: "Tinggi (2000)", value: 2000, desc: "Kombinasi jalan & olahraga rutin" },
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onProfileUpdated,
  onNavigateToFocus,
}) => {
  // Form State
  const [name, setName] = useState(currentUser?.name || "Mahasiswa Demo CampusFlow");
  const [nim, setNim] = useState(currentUser?.nim || "4.33.24.0.01");
  const [email, setEmail] = useState(currentUser?.email || "demo@campusflow.id");
  const [department, setDepartment] = useState(currentUser?.department || "Teknik Informatika");
  const [semester, setSemester] = useState("Semester 4");
  const [weeklyMetsTarget, setWeeklyMetsTarget] = useState(currentUser?.weeklyMetsTarget || 1500);
  const [focusSessionMinutes, setFocusSessionMinutes] = useState(50);
  const [targetSleepHours, setTargetSleepHours] = useState(7.5);
  const [selectedAvatarColor, setSelectedAvatarColor] = useState(
    localStorage.getItem("cf_avatar_color") || "#F7A8B0"
  );

  // Status feedback
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  // Sync state if currentUser changes from parent
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setNim(currentUser.nim);
      setEmail(currentUser.email);
      setDepartment(currentUser.department);
      setWeeklyMetsTarget(currentUser.weeklyMetsTarget);
    }
  }, [currentUser]);

  const handleAvatarColorSelect = (hex: string) => {
    setSelectedAvatarColor(hex);
    localStorage.setItem("cf_avatar_color", hex);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload: Partial<UserProfileDTO> = {
        name: name.trim() || "Mahasiswa CampusFlow",
        nim: nim.trim() || "-",
        email: email.trim() || "-",
        department,
        weeklyMetsTarget: Number(weeklyMetsTarget) || 1500,
      };

      const updated = await api.updateUserProfile(payload);
      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }

      setShowSavedFeedback(true);
      setTimeout(() => setShowSavedFeedback(false), 3000);
    } catch (err) {
      console.error("Gagal menyimpan profil:", err);
      alert("Terjadi kendala saat menyimpan profil. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasPostureBaseline = Boolean(currentUser?.postureBaselineJson);

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="learnova-card p-6 border-[#E8E8E8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-[#BDE6F0] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-xs">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-[#1A1A1A]">
              Atur Profil Pengguna
            </h1>
            <p className="text-xs text-[#9A9A9A] mt-0.5">
              Kelola data akademik, target kebugaran METs, dan personalisasi postur AI.
            </p>
          </div>
        </div>

        {showSavedFeedback && (
          <div className="flex items-center gap-2 bg-[#CDE8B5] text-[#1A1A1A] px-3.5 py-1.5 rounded-full text-xs font-bold border border-[#b2d992] animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-800" />
            <span>Profil berhasil disimpan!</span>
          </div>
        )}
      </div>

      {/* 2. Gamified Profile & Avatar Card */}
      <div className="learnova-card p-6 border-[#E8E8E8] space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Circle with Initial */}
          <div className="flex flex-col items-center gap-2.5">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-[#1A1A1A] font-extrabold text-3xl shadow-sm ring-4 ring-white transition-colors duration-300"
              style={{ backgroundColor: selectedAvatarColor }}
            >
              {name ? name.charAt(0).toUpperCase() : "M"}
            </div>
            <span className="text-[11px] font-bold text-[#9A9A9A]">Pilihan Warna Avatar</span>
            <div className="flex items-center gap-2">
              {AVATAR_BG_COLORS.map((col) => (
                <button
                  key={col.hex}
                  type="button"
                  onClick={() => handleAvatarColorSelect(col.hex)}
                  title={col.name}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    selectedAvatarColor === col.hex
                      ? "border-[#1A1A1A] scale-110 shadow-xs"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: col.hex }}
                />
              ))}
            </div>
          </div>

          {/* User Status Details */}
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h2 className="font-heading font-extrabold text-xl text-[#1A1A1A]">{name}</h2>
              </div>
              <p className="text-xs text-[#9A9A9A] font-medium mt-0.5">
                {department} • NIM {nim}
              </p>
            </div>

            {/* Gamification Badges */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="bg-[#F6F6F6] border border-[#E8E8E8] rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1 text-[#F9B99A]">
                  <Flame className="w-4 h-4 fill-[#F9B99A]" />
                  <span className="font-extrabold text-sm text-[#1A1A1A]">
                    {currentUser?.currentStreakDays || 7}
                  </span>
                </div>
                <span className="text-[10px] text-[#9A9A9A] font-medium mt-0.5">Hari Streak</span>
              </div>

              <div className="bg-[#F6F6F6] border border-[#E8E8E8] rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1 text-amber-500">
                  <Award className="w-4 h-4" />
                  <span className="font-extrabold text-sm text-[#1A1A1A]">
                    {currentUser?.xpPoints || 420}
                  </span>
                </div>
                <span className="text-[10px] text-[#9A9A9A] font-medium mt-0.5">XP Terkumpul</span>
              </div>

              <div className="bg-[#F6F6F6] border border-[#E8E8E8] rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1 text-emerald-600">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-extrabold text-sm text-[#1A1A1A]">Level 4</span>
                </div>
                <span className="text-[10px] text-[#9A9A9A] font-medium mt-0.5">Habit Champion</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Form Input Data Pribadi & Akademik */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="learnova-card p-6 border-[#E8E8E8] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E8E8E8]">
            <BookOpen className="w-4 h-4 text-[#1A1A1A]" />
            <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
              Informasi Mahasiswa &amp; Kontak
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#9A9A9A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  required
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-[#F6F6F6] border border-[#E8E8E8] rounded-xl text-[#1A1A1A] focus:outline-none focus:bg-white focus:border-[#BDE6F0] transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
                Nomor Induk Mahasiswa (NIM)
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-[#9A9A9A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  placeholder="4.xx.xx.x.xx"
                  required
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-[#F6F6F6] border border-[#E8E8E8] rounded-xl text-[#1A1A1A] focus:outline-none focus:bg-white focus:border-[#BDE6F0] transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
                Email Kampus
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9A9A9A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@campusflow.id"
                  required
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-[#F6F6F6] border border-[#E8E8E8] rounded-xl text-[#1A1A1A] focus:outline-none focus:bg-white focus:border-[#BDE6F0] transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
                Program Studi / Jurusan
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-[#F6F6F6] border border-[#E8E8E8] rounded-xl text-[#1A1A1A] focus:outline-none focus:bg-white focus:border-[#BDE6F0] transition-all font-medium"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
                Semester Berjalan
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-[#F6F6F6] border border-[#E8E8E8] rounded-xl text-[#1A1A1A] focus:outline-none focus:bg-white focus:border-[#BDE6F0] transition-all font-medium"
              >
                {Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`).map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 4. Target & Parameter Ergonomi Wellbeing */}
        <div className="learnova-card p-6 border-[#E8E8E8] space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E8E8E8]">
            <Target className="w-4 h-4 text-[#1A1A1A]" />
            <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
              Target Kebugaran &amp; Kebiasaan Belajar Sehat
            </h3>
          </div>

          {/* Weekly METs Target */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-[#1A1A1A]">
                  Target Poin Gerak Mingguan (Aktivitas Fisik)
                </label>
                <p className="text-[11px] text-[#9A9A9A]">
                  Panduan: 600 Poin (ringan) hingga 1500+ Poin (aktif bugar, setara jalan kaki rutin 30 mnt/hari).
                </p>
              </div>
              <span className="text-sm font-extrabold text-[#1A1A1A] bg-[#FFF29A] px-3 py-1 rounded-xl border border-[#FFE966]">
                {weeklyMetsTarget} Poin
              </span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MET_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setWeeklyMetsTarget(preset.value)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    weeklyMetsTarget === preset.value
                      ? "bg-[#FFF29A] border-[#FFE966] text-[#1A1A1A] shadow-xs font-bold"
                      : "bg-[#F6F6F6] border-[#E8E8E8] text-[#9A9A9A] hover:text-[#1A1A1A] hover:bg-white"
                  }`}
                >
                  <div className="text-xs font-bold">{preset.label}</div>
                  <div className="text-[10px] opacity-80 truncate">{preset.desc}</div>
                </button>
              ))}
            </div>

            <input
              type="range"
              min="600"
              max="3000"
              step="50"
              value={weeklyMetsTarget}
              onChange={(e) => setWeeklyMetsTarget(Number(e.target.value))}
              className="w-full accent-[#1A1A1A] cursor-pointer"
            />
          </div>

          {/* Focus & Sleep Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#F6F6F6] border border-[#E8E8E8] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1A1A]">Ambang Batas Sesi Duduk</span>
                <span className="text-xs font-extrabold text-[#1A1A1A]">
                  {focusSessionMinutes} Menit
                </span>
              </div>
              <p className="text-[10px] text-[#9A9A9A]">
                Waktu belajar maksimal di depan monitor sebelum prompt peregangan aktif.
              </p>
              <div className="flex gap-2 pt-1">
                {[45, 50, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setFocusSessionMinutes(mins)}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                      focusSessionMinutes === mins
                        ? "bg-[#1A1A1A] text-white"
                        : "bg-white border border-[#E8E8E8] text-[#9A9A9A]"
                    }`}
                  >
                    {mins} mnt
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F6F6F6] border border-[#E8E8E8] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1A1A]">Target Tidur Harian</span>
                <span className="text-xs font-extrabold text-[#1A1A1A]">
                  {targetSleepHours} Jam
                </span>
              </div>
              <p className="text-[10px] text-[#9A9A9A]">
                Rekomendasi durasi istirahat malam mahasiswa untuk menjaga fokus kognitif.
              </p>
              <div className="flex gap-2 pt-1">
                {[7.0, 7.5, 8.0].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setTargetSleepHours(hrs)}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                      targetSleepHours === hrs
                        ? "bg-[#1A1A1A] text-white"
                        : "bg-white border border-[#E8E8E8] text-[#9A9A9A]"
                    }`}
                  >
                    {hrs} jam
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 5. Posture Baseline Status Card */}
        <div className="learnova-card p-6 border-[#E8E8E8] space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#CDE8B5] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-xs">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
                  Pengaturan Posisi Duduk AI (Kamera)
                </h3>
                <p className="text-xs text-[#9A9A9A] mt-0.5 leading-relaxed">
                  Pengaturan awal mengenali posisi duduk tegak alami Anda di depan kamera untuk
                  mendeteksi bungkuk dan jarak terlalu dekat ke layar secara akurat.
                </p>
              </div>
            </div>

            {onNavigateToFocus && (
              <button
                type="button"
                onClick={onNavigateToFocus}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#1A1A1A] bg-[#FFF29A] hover:bg-[#FFE966] transition-all border border-[#FFE966] shrink-0 shadow-xs"
              >
                {hasPostureBaseline ? "Atur Ulang" : "Mulai Atur Posisi"} &rarr;
              </button>
            )}
          </div>
        </div>

        {/* 6. Form Submission Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (currentUser) {
                setName(currentUser.name);
                setNim(currentUser.nim);
                setEmail(currentUser.email);
                setDepartment(currentUser.department);
                setWeeklyMetsTarget(currentUser.weeklyMetsTarget);
              }
            }}
            className="px-4 py-2.5 rounded-full text-xs font-bold text-[#9A9A9A] hover:text-[#1A1A1A] hover:bg-[#F6F6F6] transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-[#1A1A1A] bg-[#FFF29A] hover:bg-[#FFE966] active:scale-95 transition-all shadow-xs border border-[#FFE966] flex items-center gap-2"
          >
            {isSaving ? (
              <span>Menyimpan...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Profil</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
