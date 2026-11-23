/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- 3-Color Minimalist Sage, Linen & Ivory Palette ---
        softSage: {
          DEFAULT: "#CFD8C4", // Swatch 1: Primary buttons, accents, active icons
          400: "#BCC8AE",     // Hover state for primary buttons
          500: "#CFD8C4",
          600: "#636B60",     // Muted text
          700: "#2F3A2E",     // Deep sage-charcoal ink for WCAG AAA readability
        },
        warmLinen: {
          DEFAULT: "#E8DDCF", // Swatch 2: Active pills, secondary buttons, borders
          300: "#DDD0BE",     // Hover state for secondary buttons
          400: "#E8DDCF",
        },
        warmIvory: {
          DEFAULT: "#FAF6F0", // Swatch 3: Main web background canvas & sidebar
          100: "#FFFFFF",     // Crisp elevated cards
          200: "#FAF6F0",
        },

        // --- Semantic & Backward-Compatible Mappings (Strictly 3 Colors) ---
        sky: {
          DEFAULT: "#CFD8C4",
          50: "#FAF6F0",
          100: "#FAF6F0",
          200: "#E8DDCF",
          300: "#CFD8C4",
          400: "#BCC8AE",
          500: "#CFD8C4",
        },
        mint: {
          DEFAULT: "#CFD8C4",
          50: "#FAF6F0",
          100: "#FAF6F0",
          200: "#E8DDCF",
          300: "#CFD8C4",
          400: "#BCC8AE",
          500: "#CFD8C4",
        },
        butter: {
          DEFAULT: "#E8DDCF",
          50: "#FAF6F0",
          100: "#FAF6F0",
          200: "#E8DDCF",
          300: "#DDD0BE",
          400: "#E8DDCF",
          500: "#E8DDCF",
        },
        peach: {
          DEFAULT: "#E8DDCF",
          50: "#FAF6F0",
          100: "#FAF6F0",
          200: "#E8DDCF",
          300: "#DDD0BE",
          400: "#CFD8C4",
        },
        softPink: {
          DEFAULT: "#E8DDCF",
          50: "#FAF6F0",
          100: "#FAF6F0",
          200: "#E8DDCF",
          300: "#DDD0BE",
          400: "#CFD8C4",
        },
        lavender: {
          DEFAULT: "#CFD8C4",
          50: "#FAF6F0",
          100: "#FAF6F0",
          200: "#E8DDCF",
          300: "#CFD8C4",
        },

        // Neutral & Layout Mappings
        pureWhite: "#FFFFFF",
        cloud: "#FAF6F0",
        lightGray: "#E8DDCF",
        ink: "#2F3A2E",
        muted: "#636B60",

        surface: "#FAF6F0",
        card: "#FFFFFF",
        cardBorder: "#E8DDCF",
        textMain: "#2F3A2E",
        textMuted: "#636B60",

        primary: {
          DEFAULT: "#CFD8C4",
          50: "#FAF6F0",
          100: "#FAF6F0",
          200: "#E8DDCF",
          300: "#CFD8C4",
          400: "#CFD8C4",
          500: "#CFD8C4",
          600: "#BCC8AE",
          700: "#2F3A2E",
        },
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 16px -4px rgba(47, 58, 46, 0.05), 0 1px 3px 0 rgba(47, 58, 46, 0.03)",
        cardHover: "0 10px 24px -6px rgba(47, 58, 46, 0.09), 0 3px 8px -2px rgba(47, 58, 46, 0.04)",
        softPill: "0 4px 12px -2px rgba(207, 216, 196, 0.45)",
        softSky: "0 4px 14px -2px rgba(207, 216, 196, 0.45)",
        softMint: "0 4px 14px -2px rgba(207, 216, 196, 0.45)",
        softRosy: "0 4px 14px -2px rgba(232, 221, 207, 0.50)",
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
