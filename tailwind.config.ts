import forms from "@tailwindcss/forms"
import typography from "@tailwindcss/typography"
import type { Config } from "tailwindcss"
import colors from "tailwindcss/colors"
import defaultTheme from "tailwindcss/defaultTheme"
import plugin from "tailwindcss/plugin"

const config: Config = {
  darkMode: "selector",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["CircularXXSub", ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        "6xl": [
          "4rem",
          {
            lineHeight: "4rem",
            letterSpacing: "0.04rem",
          },
        ],
        "3xl": [
          "2rem",
          {
            lineHeight: "2.5rem",
            letterSpacing: "0.02rem",
          },
        ],
      },
      spacing: {
        "2px": "2px",
        15: "3.75rem",
      },
      maxWidth: {
        "5xl": "65rem", // 1040px
        "8xl": "95rem",
      },
      colors: {
        white: {
          DEFAULT: "rgba(253, 253, 252, 1)",
          900: "rgba(226, 225, 222, 1)",
          300: "rgba(238, 238, 236, 1)",
          200: "rgba(32, 16, 0, 0.06)",
          100: "rgba(255, 255, 255, 1)",
        },
        black: {
          DEFAULT: "#041417",
          950: "rgba(42, 42, 40, 1)",
          900: "rgba(25, 25, 24, 1)",
          800: "rgba(17, 17, 16, 1)",
          700: "rgba(24, 25, 26, 1)",
          600: "rgba(22, 22, 21, 1)",
          500: "rgba(28, 32, 36, 1)",
          400: "rgba(33, 32, 28, 1)",
          300: "rgba(4, 20, 23, 1)",
          200: "rgba(130, 130, 124, 1)",
          100: "rgba(232, 232, 232, 1)",
        },
        gray: colors.stone,
        silver: {
          300: "rgba(246, 246, 245, 0.07)",
          200: "rgba(139, 141, 152, 1)",
          100: "rgba(31, 24, 0, 0.13)",
        },
        blue: colors.blue,
        amber: colors.amber,
        red: {
          600: "rgba(206, 44, 49, 1)",
          500: "rgba(229, 72, 77, 1)",
          400: "rgba(204, 78, 0, 0.77)",
          200: "rgba(251, 106, 0, 0.15)",
          100: "rgba(255, 156, 0, 0.16)",
        },
        pink: {
          DEFAULT: "rgba(214, 64, 159, 1)",
        },
        green: {
          800: "rgba(134, 234, 212, 1)",
          400: "rgba(33, 131, 88, 1)",
          100: "rgba(0, 164, 51, 0.1)",
          DEFAULT: "rgba(0, 113, 63, 0.87)",
        },
        primary: {
          DEFAULT: "rgba(247, 107, 21, 1)",
          400: "rgba(255, 160, 87, 1)",
          300: "rgba(204, 78, 0, 1)",
          200: "rgba(219, 95, 0, 1)",
          100: "rgba(239, 95, 0, 1)",
        },
        secondary: "#82827c",
        warning: "var(--color-warning)",
        "warning-foreground": "var(--color-warning-foreground)",
      },
      boxShadow: {
        paper:
          "0px 8px 40px 0px rgba(0, 0, 0, 0.05), 0px 12px 32px -16px rgba(32, 16, 0, 0.06);",
        "paper-dark":
          "0px 12px 32px -16px rgba(246, 246, 245, 0.07), 0px 8px 40px 0px rgba(0, 0, 0, 0.05)",
        widget:
          "0px 12px 62px 0px rgba(0, 0, 0, 0.15), 0px 12px 32px -16px rgba(31, 24, 0, 0.13)",
        "select-token":
          "0px 0px 0px 0.5px rgba(0, 0, 0, 0.05), 0px 1px 4px 0px rgba(31, 21, 0, 0.1), 0px 2px 1px -1px rgba(0, 0, 0, 0.05), 0px 1px 3px 0px rgba(0, 0, 0, 0.05)",
        "select-token-dark":
          "0px 1px 3px 0px rgba(0, 0, 0, 0.05), 0px 2px 1px -1px rgba(0, 0, 0, 0.05), 0px 1px 4px 0px rgba(254, 254, 243, 0.11), 0px 0px 0px 0.5px rgba(0, 0, 0, 0.05)",
        "home-paper": "0px -28px 40px 0px rgba(0, 0, 0, 0.08)",
        "card-multi":
          "0px 12px 32px -16px rgba(31, 24, 0, 0.13), 0px 12px 60px 0px rgba(0, 0, 0, 0.15)",
        "card-history":
          "0px 16px 36px -20px rgba(25, 20, 0, 0.21), 0px 16px 64px 0px rgba(37, 37, 0, 0.03), 0px 12px 60px 0px rgba(0, 0, 0, 0.15)",
        "switch-token":
          "0px 1px 3px 0px rgba(0, 0, 0, 0.05), 0px 2px 1px -1px rgba(0, 0, 0, 0.05), 0px 1px 4px 0px rgba(31, 21, 0, 0.10), 0px 0px 0px 0.5px rgba(0, 0, 0, 0.05)",
        "switch-token-dark":
          "0px 1px 3px 0px rgba(255, 255, 255, 0.05), 0px 2px 1px -1px rgba(255, 255, 255, 0.05), 0px 1px 4px 0px rgba(224, 234, 255, 0.10), 0px 0px 0px 0.5px rgba(255, 255, 255, 0.05)",
      },
      scale: {
        103: "1.03",
      },
      borderRadius: {
        "4xl": "1.875rem",
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      backgroundImage: {
        "page-light": "url(/static/images/bg-light.svg)",
        "page-dark": "url(/static/images/bg-dark.svg)",
        "page-light--mobile": "url(/static/images/bg-light--mobile.svg)",
        "page-dark--mobile": "url(/static/images/bg-dark--mobile.svg)",
        "card-vision-account-fi": "url(/static/images/group-account-fi.svg)",
        "card-vision-account-fi--mobile":
          "url(/static/images/group-account-fi--mobile.svg)",
        "card-vision-multi-cover": "url(/static/images/group-multi-cover.svg)",
        "card-vision-multi-cover--mobile":
          "url(/static/images/group-multi-cover--mobile.svg)",
        "card-vision-bringing":
          "url(/static/images/group-account-bringing.svg)",
        "card-vision-bringing--mobile":
          "url(/static/images/group-account-bringing--mobile.svg)",
      },
    },
    display: ["group-hover"],
  },
  plugins: [
    forms,
    typography,
    plugin(({ addUtilities }) => {
      const newUtilities = {
        ".hide-scrollbar": {
          "scrollbar-width": "none",
          "-ms-overflow-style": "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },

        ".hide-spinners": {
          "-moz-appearance": "textfield",
          "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
            "-webkit-appearance": "none",
            margin: "0",
          },
        },
      }
      addUtilities(newUtilities)
    }),
  ],
}
export default config
