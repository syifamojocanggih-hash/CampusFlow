/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Fresh Pastel Health & Calorie Palette ---
        // Warna Utama
        sky: {
          DEFAULT: "#BDE6F0", // Sky Blue: Your Progress, Water, Taco
          50: "#F4FAFC",
          100: "#E6F5F8",
          200: "#D3EFF5",
          300: "#BDE6F0",
          400: "#A2DCF0",
          500: "#83D0E8",
        },
        mint: {
          DEFAULT: "#CDE8B5", // Mint Green: Breakfast, Cal/Prot/Carb bars
          50: "#F7FAF3",
          100: "#EEF7E6",
          200: "#DFEFD0",
          300: "#CDE8B5",
          400: "#B6DF97",
          500: "#9ED378",
        },
        butter: {
          DEFAULT: "#FFF29A", // Butter Yellow: Calorie count button, active nav
          50: "#FFFDF0",
          100: "#FFFAE0",
          200: "#FFF6BD",
          300: "#FFF29A",
          400: "#FFE966",
          500: "#FFDD33",
        },

        // Warna Pendukung
        peach: {
          DEFAULT: "#F9B99A", // Peach Orange: Calorie progress ring
          50: "#FDF5F2",
          100: "#FCE8E0",
          200: "#FBD4C3",
          300: "#F9B99A",
          400: "#F6966C",
        },
        softPink: {
          DEFAULT: "#F7A8B0", // Soft Pink: Badge notifikasi, latar avatar
          50: "#FCF4F5",
          100: "#FAE5E7",
          200: "#F7CED3",
          300: "#F7A8B0",
          400: "#F27885",
        },
        lavender: {
          DEFAULT: "#C9B3E6", // Lavender: Indikator kecil di kartu
          50: "#F8F5FC",
          100: "#F0EBF9",
          200: "#DFD4F2",
          300: "#C9B3E6",
          400: "#AE8ED6",
        },

        // Warna Netral
        pureWhite: "#FFFFFF",
        cloud: "#F6F6F6",     // Cloud Gray: Kartu netral, tombol ikon, track bar
        lightGray: "#E8E8E8", // Light Gray: Garis/border dan latar halaman presentasi
        ink: "#1A1A1A",       // Ink Black: Teks utama dan angka besar
        muted: "#9A9A9A",     // Muted Gray: Teks sekunder (Kg, Kcal, label)

        // General Mappings for Layout
        surface: "#F6F6F6",
        card: "#FFFFFF",
        cardBorder: "#E8E8E8",
        textMain: "#1A1A1A",
        textMuted: "#9A9A9A",

        primary: {
          DEFAULT: "#1A1A1A",
          50: "#F6F6F6",
          100: "#E8E8E8",
          200: "#BDE6F0",
          300: "#CDE8B5",
          400: "#FFF29A",
          500: "#1A1A1A",
          600: "#1A1A1A",
          700: "#000000",
        },
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 10px -2px rgba(26, 26, 26, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
        cardHover: "0 8px 20px -4px rgba(26, 26, 26, 0.07), 0 3px 6px -2px rgba(0, 0, 0, 0.02)",
        softPill: "0 2px 8px -1px rgba(255, 242, 154, 0.4)",
        softSky: "0 4px 14px -2px rgba(189, 230, 240, 0.4)",
        softMint: "0 4px 14px -2px rgba(205, 232, 181, 0.4)",
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      }
    },
  },
  plugins: [],
}
