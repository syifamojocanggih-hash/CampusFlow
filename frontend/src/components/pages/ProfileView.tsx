import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  BookOpen,
  Flame,
  Award,
  Save,
  RotateCcw,
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
  { name: "Soft Pink", hex: "#F2D3D1" },
  { name: "Sky Blue", hex: "#C9DCE6" },
  { name: "Mint Green", hex: "#C9DCE6" },
  { name: "Butter Yellow", hex: "#E7DCCF" },
  { name: "Lavender", hex: "#F2D3D1" },
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

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onProfileUpdated,
  onNavigateToFocus: _onNavigateToFocus,
}) => {
  // Form State
  const [name, setName] = useState(currentUser?.name || "Mahasiswa CampusFlow");
  const [nim, setNim] = useState(currentUser?.nim || "-");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [department, setDepartment] = useState(currentUser?.department || "Teknik Informatika");
  const [semester, setSemester] = useState("Semester 3");
  const [weeklyMetsTarget, setWeeklyMetsTarget] = useState(currentUser?.weeklyMetsTarget ?? 1500);
  const [selectedAvatarColor, setSelectedAvatarColor] = useState(
    localStorage.getItem("cf_avatar_color") || "#F2D3D1"
  );

  // Status feedback
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  // Sync state if currentUser changes from parent
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setNim(currentUser.nim || "-");
      setEmail(currentUser.email);
      setDepartment(currentUser.department);
      setWeeklyMetsTarget(currentUser.weeklyMetsTarget ?? 1500);
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

  return (
    <div className="space-y-6 w-full pb-12">
      {/* 1. Header Banner */}
      <div className="learnova-card p-6 border-[#E8DDCF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-[#E8DDCF] text-[#2F3A2E] flex items-center justify-center shrink-0 shadow-xs">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-[#2F3A2E]">
              Atur Profil Pengguna
            </h1>
            <p className="text-xs text-[#636B60] mt-0.5">
              Kelola data identitas dan informasi akademik mahasiswa.
            </p>
          </div>
        </div>

        {showSavedFeedback && (
          <div className="flex items-center gap-2 bg-[#E8DDCF] text-[#2F3A2E] px-3.5 py-1.5 rounded-full text-xs font-bold border border-[#CFD8C4] animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-800" />
            <span>Profil berhasil disimpan!</span>
          </div>
        )}
      </div>

      {/* 2. Gamified Profile & Avatar Card */}
      <div className="learnova-card p-6 border-[#E8DDCF] space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Circle with Initial */}
          <div className="flex flex-col items-center gap-2.5">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-[#2F3A2E] font-extrabold text-3xl shadow-sm ring-4 ring-white transition-colors duration-300"
              style={{ backgroundColor: selectedAvatarColor }}
            >
              {name ? name.charAt(0).toUpperCase() : "M"}
            </div>
            <span className="text-[11px] font-bold text-[#636B60]">Pilihan Warna Avatar</span>
            <div className="flex items-center gap-2">
              {AVATAR_BG_COLORS.map((col) => (
                <button
                  key={col.hex}
                  type="button"
                  onClick={() => handleAvatarColorSelect(col.hex)}
                  title={col.name}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${selectedAvatarColor === col.hex
                      ? "border-[#4A3B2C] scale-110 shadow-xs"
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
                <h2 className="font-heading font-extrabold text-xl text-[#2F3A2E]">{name}</h2>
              </div>
              <p className="text-xs text-[#636B60] font-medium mt-0.5">
                {department} • NIM {nim}
              </p>
            </div>

            {/* Gamification Badges */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="bg-[#FAF6F0] border border-[#E8DDCF] rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1 text-[#F2D3D1]">
                  <Flame className="w-4 h-4 fill-[#F2D3D1]" />
                  <span className="font-extrabold text-sm text-[#2F3A2E]">
                    {currentUser?.currentStreakDays ?? 1}
                  </span>
                </div>
                <span className="text-[10px] text-[#636B60] font-medium mt-0.5">Hari Streak</span>
              </div>

              <div className="bg-[#FAF6F0] border border-[#E8DDCF] rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1 text-amber-500">
                  <Award className="w-4 h-4" />
                  <span className="font-extrabold text-sm text-[#2F3A2E]">
                    {currentUser?.xpPoints ?? 0}
                  </span>
                </div>
                <span className="text-[10px] text-[#636B60] font-medium mt-0.5">XP Terkumpul</span>
              </div>

              <div className="bg-[#FAF6F0] border border-[#E8DDCF] rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1 text-emerald-600">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-extrabold text-sm text-[#2F3A2E]">
                    Level {Math.max(1, Math.floor((currentUser?.xpPoints ?? 0) / 100) + 1)}
                  </span>
                </div>
                <span className="text-[10px] text-[#636B60] font-medium mt-0.5">Habit Champion</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Form Input Data Pribadi & Akademik */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="learnova-card p-6 border-[#E8DDCF] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E8DDCF]">
            <BookOpen className="w-4 h-4 text-[#2F3A2E]" />
            <h3 className="font-heading font-extrabold text-sm text-[#2F3A2E]">
              Informasi Mahasiswa &amp; Kontak
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2F3A2E] mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#636B60] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  required
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-[#FAF6F0] border border-[#E8DDCF] rounded-xl text-[#2F3A2E] focus:outline-none focus:bg-white focus:border-[#CFD8C4] transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2F3A2E] mb-1.5">
                Nomor Induk Mahasiswa (NIM)
              </label>
              <input
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="43324001"
                required
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF6F0] border border-[#E8DDCF] rounded-xl text-[#2F3A2E] focus:outline-none focus:bg-white focus:border-[#CFD8C4] transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2F3A2E] mb-1.5">
                Email Kampus
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#636B60] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@campusflow.id"
                  required
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-[#FAF6F0] border border-[#E8DDCF] rounded-xl text-[#2F3A2E] focus:outline-none focus:bg-white focus:border-[#CFD8C4] transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2F3A2E] mb-1.5">
                Program Studi / Jurusan
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-[#FAF6F0] border border-[#E8DDCF] rounded-xl text-[#2F3A2E] focus:outline-none focus:bg-white focus:border-[#CFD8C4] transition-all font-medium"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#2F3A2E] mb-1.5">
                Semester Berjalan
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-[#FAF6F0] border border-[#E8DDCF] rounded-xl text-[#2F3A2E] focus:outline-none focus:bg-white focus:border-[#CFD8C4] transition-all font-medium"
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

        {/* 4. Form Submission Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (currentUser) {
                setName(currentUser.name);
                setNim(currentUser.nim ? currentUser.nim.replace(/[^0-9]/g, "") : "43324001");
                setEmail(currentUser.email);
                setDepartment(currentUser.department);
                setWeeklyMetsTarget(currentUser.weeklyMetsTarget);
              }
            }}
            className="px-4 py-2.5 rounded-full text-xs font-bold text-[#636B60] hover:text-[#2F3A2E] hover:bg-[#FAF6F0] transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-[#2F3A2E] bg-[#E8DDCF] hover:bg-[#CFD8C4] active:bg-[#CFD8C4] active:scale-95 transition-all shadow-xs border border-[#E8DDCF] flex items-center gap-2"
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
