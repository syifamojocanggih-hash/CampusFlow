import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react";
import { api } from "@/lib/api";
import type { UserProfileDTO } from "@/types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfileDTO) => void;
  defaultTab?: "login" | "register";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultTab = "login",
}) => {
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Sync tab state when modal is opened or defaultTab changes
  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      setErrorMessage(null);
      setShowPassword(false);
    }
  }, [isOpen, defaultTab]);

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regNim, setRegNim] = useState("");
  const [regDept, setRegDept] = useState("Teknik Informatika");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!loginEmail.trim()) {
      setErrorMessage("Silakan masukkan email kampus Anda.");
      return;
    }
    if (!loginPassword) {
      setErrorMessage("Silakan masukkan password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.login(loginEmail.trim(), loginPassword);
      onSuccess(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal masuk ke akun.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!regName.trim() || !regNim.trim() || !regEmail.trim() || !regPassword) {
      setErrorMessage("Mohon lengkapi semua bidang isian formulir.");
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage("Password minimal terdiri dari 6 karakter.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.register({
        name: regName.trim(),
        nim: regNim.trim(),
        department: regDept.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });
      onSuccess(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mendaftarkan akun.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.loginDemo();
      onSuccess(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal masuk mode demo.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#E8DDCF] space-y-5 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-[#FAF6F0] hover:bg-[#CFD8C4] text-[#2F3A2E] flex items-center justify-center transition-colors absolute top-5 right-5"
          title="Tutup Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#E8DDCF] flex items-center justify-center text-[#2F3A2E] shadow-xs shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-lg text-[#2F3A2E] leading-tight flex items-center gap-2">
              {tab === "login" ? (
                <>
                  <LogIn className="w-4 h-4 text-[#2F3A2E]" />
                  <span>Masuk ke CampusFlow</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-[#2F3A2E]" />
                  <span>Daftar Akun Mahasiswa</span>
                </>
              )}
            </h3>
            <p className="text-[11px] text-[#636B60]">
              Academic Strava &amp; Predictive Burnout Management
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-[#E8DDCF] border border-[#CFD8C4] text-[#2F3A2E] text-xs font-medium leading-relaxed">
            {errorMessage}
          </div>
        )}

        {/* 1. TAB LOGIN */}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#2F3A2E] block">Email Mahasiswa</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#636B60] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="nama@mahasiswa.kampus.ac.id"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCF] text-xs text-[#2F3A2E] placeholder-[#636B60] focus:outline-none focus:bg-white focus:border-[#CFD8C4] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#2F3A2E] block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#636B60] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCF] text-xs text-[#2F3A2E] placeholder-[#636B60] focus:outline-none focus:bg-white focus:border-[#CFD8C4] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#636B60] hover:text-[#2F3A2E] absolute right-1.5 top-1/2 -translate-y-1/2 transition-colors"
                  title={showPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-2xl bg-[#CFD8C4] hover:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE] font-extrabold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? "Memproses Masuk..." : "Masuk ke Dashboard"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="pt-2 border-t border-[#E8DDCF] space-y-2.5">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-3 rounded-2xl bg-[#FAF6F0] hover:bg-[#FAF6F0] text-[#2F3A2E] text-xs font-bold transition-colors border border-[#E8DDCF] flex items-center justify-center gap-2 shadow-xs active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#EAB308]" />
                <span>Masuk Cepat (Akun Demo Mahasiswa)</span>
              </button>

              <p className="text-[11px] text-center text-[#636B60]">
                Belum memiliki akun?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setTab("register");
                    setErrorMessage(null);
                  }}
                  className="font-bold text-[#2F3A2E] hover:underline"
                >
                  Daftar di sini
                </button>
              </p>
            </div>
          </form>
        )}

        {/* 2. TAB REGISTER */}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#2F3A2E] block">Nama Lengkap</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#636B60] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Mutiara Dewanda"
                  className="w-full pl-10 pr-3.5 py-2 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCF] text-xs text-[#2F3A2E] placeholder-[#636B60] focus:outline-none focus:bg-white focus:border-[#CFD8C4] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#2F3A2E] block">NIM Mahasiswa</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={regNim}
                  onChange={(e) => setRegNim(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="43324001"
                  className="w-full px-3 py-2 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCF] text-xs text-[#2F3A2E] placeholder-[#636B60] focus:outline-none focus:bg-white focus:border-[#CFD8C4] transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#2F3A2E] block">Program Studi</label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-[#636B60] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={regDept}
                    onChange={(e) => setRegDept(e.target.value)}
                    placeholder="Teknik Informatika"
                    className="w-full pl-9 pr-3 py-2 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCF] text-xs text-[#2F3A2E] placeholder-[#636B60] focus:outline-none focus:bg-white focus:border-[#CFD8C4] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#2F3A2E] block">Email Kampus</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#636B60] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="tiara@mahasiswa.kampus.ac.id"
                  className="w-full pl-10 pr-3.5 py-2 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCF] text-xs text-[#2F3A2E] placeholder-[#636B60] focus:outline-none focus:bg-white focus:border-[#CFD8C4] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#2F3A2E] block">Buat Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#636B60] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-10 pr-10 py-2 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCF] text-xs text-[#2F3A2E] placeholder-[#636B60] focus:outline-none focus:bg-white focus:border-[#CFD8C4] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#636B60] hover:text-[#2F3A2E] absolute right-1.5 top-1/2 -translate-y-1/2 transition-colors"
                  title={showPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-2xl bg-[#CFD8C4] hover:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE] font-extrabold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#636B60]" />
              <span>{isLoading ? "Mendaftarkan Akun..." : "Daftar Akun Baru"}</span>
            </button>

            <div className="pt-2 border-t border-[#E8DDCF]">
              <p className="text-[11px] text-center text-[#636B60]">
                Sudah memiliki akun mahasiswa?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setTab("login");
                    setErrorMessage(null);
                  }}
                  className="font-bold text-[#2F3A2E] hover:underline"
                >
                  Masuk di sini
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
