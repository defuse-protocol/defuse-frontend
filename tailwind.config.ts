import forms from "@tailwindcss/forms"
import typography from "@tailwindcss/typography"
import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"
import colors from "tailwindcss/colors"
import defaultTheme from "tailwindcss/defaultTheme"
import plugin from "tailwindcss/plugin"

const config: Config = {
  darkMode: "selector",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/components/**/*.{js,ts,jsx,tsx,mdx}",
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
        gray: {
          // Figma design uses Sand palette from Radix colors.
          // "Stone" is the closest match in Tailwind colors.
          ...colors.stone,

          // Use aliases so they automatically switch for templates from global.scss
          1: "var(--sand-1-alias)",
          2: "var(--sand-2-alias)",
          3: "var(--sand-3-alias)",
          4: "var(--sand-4-alias)",
          5: "var(--sand-5-alias)",
          6: "var(--sand-6-alias)",
          7: "var(--sand-7-alias)",
          8: "var(--sand-8-alias)",
          9: "var(--sand-9-alias)",
          10: "var(--sand-10-alias)",
          11: "var(--sand-11-alias)",
          12: "var(--sand-12-alias)",
          // Alpha variants
          a1: "var(--sand-a1-alias)",
          a2: "var(--sand-a2-alias)",
          a3: "var(--sand-a3-alias)",
          a4: "var(--sand-a4-alias)",
          a5: "var(--sand-a5-alias)",
          a6: "var(--sand-a6-alias)",
          a7: "var(--sand-a7-alias)",
          a8: "var(--sand-a8-alias)",
          a9: "var(--sand-a9-alias)",
          a10: "var(--sand-a10-alias)",
          a11: "var(--sand-a11-alias)",
          a12: "var(--sand-a12-alias)",
        },
        silver: {
          300: "rgba(246, 246, 245, 0.07)",
          200: "rgba(139, 141, 152, 1)",
          100: "rgba(31, 24, 0, 0.13)",
        },
        blue: {
          ...colors.blue,
          // Cyan variants
          c11: "var(--cyan-11)",
        },
        amber: colors.amber,
        red: {
          ...colors.red,
          600: "rgba(206, 44, 49, 1)",
          500: "rgba(229, 72, 77, 1)",
          400: "rgba(204, 78, 0, 0.77)",
          200: "rgba(251, 106, 0, 0.15)",
          100: "rgba(255, 156, 0, 0.16)",
          // defuse sdk:
          1: "var(--red-1)",
          2: "var(--red-2)",
          3: "var(--red-3)",
          4: "var(--red-4)",
          5: "var(--red-5)",
          6: "var(--red-6)",
          7: "var(--red-7)",
          8: "var(--red-8)",
          9: "var(--red-9)",
          10: "var(--red-10)",
          11: "var(--red-11)",
          12: "var(--red-12)",
          // Alpha variants
          a1: "var(--red-a1)",
          a2: "var(--red-a2)",
          a3: "var(--red-a3)",
          a4: "var(--red-a4)",
          a5: "var(--red-a5)",
          a6: "var(--red-a6)",
          a7: "var(--red-a7)",
          a8: "var(--red-a8)",
          a9: "var(--red-a9)",
          a10: "var(--red-a10)",
          a11: "var(--red-a11)",
          a12: "var(--red-a12)",
        },
        pink: {
          DEFAULT: "rgba(214, 64, 159, 1)",
        },
        green: {
          ...colors.green,
          800: "rgba(134, 234, 212, 1)",
          400: "rgba(33, 131, 88, 1)",
          100: "rgba(0, 164, 51, 0.1)",
          DEFAULT: "rgba(0, 113, 63, 0.87)",

          // defuse sdk:
          1: "var(--green-1)",
          2: "var(--green-2)",
          3: "var(--green-3)",
          4: "var(--green-4)",
          5: "var(--green-5)",
          6: "var(--green-6)",
          7: "var(--green-7)",
          8: "var(--green-8)",
          9: "var(--green-9)",
          10: "var(--green-10)",
          11: "var(--green-11)",
          12: "var(--green-12)",
          // Alpha variants
          a1: "var(--green-a1)",
          a2: "var(--green-a2)",
          a3: "var(--green-a3)",
          a4: "var(--green-a4)",
          a5: "var(--green-a5)",
          a6: "var(--green-a6)",
          a7: "var(--green-a7)",
          a8: "var(--green-a8)",
          a9: "var(--green-a9)",
          a10: "var(--green-a10)",
          a11: "var(--green-a11)",
          a12: "var(--green-a12)",
        },
        primary: {
          DEFAULT: "rgba(247, 107, 21, 1)",
          400: "rgba(255, 160, 87, 1)",
          300: "rgba(204, 78, 0, 1)",
          200: "rgba(219, 95, 0, 1)",
          100: "rgba(239, 95, 0, 1)",
        },
        secondary: "#82827c",
        border: "var(--color-border)",
        warning: "var(--color-warning)",
        "warning-foreground": "var(--color-warning-foreground)",

        accent: {
          DEFAULT: "var(--accent-9)",
          50: "var(--accent-1)",
          100: "var(--accent-2)",
          200: "var(--accent-3)",
          300: "var(--accent-4)",
          400: "var(--accent-5)",
          500: "var(--accent-6)",
          600: "var(--accent-7)",
          700: "var(--accent-8)",
          800: "var(--accent-10)",
          900: "var(--accent-11)",
          950: "var(--accent-12)",
          // Alpha variants
          a50: "var(--accent-a1)",
          a100: "var(--accent-a2)",
          a200: "var(--accent-a3)",
          a300: "var(--accent-a4)",
          a400: "var(--accent-a5)",
          a500: "var(--accent-a6)",
          a600: "var(--accent-a7)",
          a700: "var(--accent-a8)",
          a800: "var(--accent-a10)",
          a900: "var(--accent-a11)",
          a950: "var(--accent-a12)",

          1: "var(--accent-1)",
          2: "var(--accent-2)",
          3: "var(--accent-3)",
          4: "var(--accent-4)",
          5: "var(--accent-5)",
          6: "var(--accent-6)",
          7: "var(--accent-7)",
          8: "var(--accent-8)",
          9: "var(--accent-9)",
          10: "var(--accent-10)",
          11: "var(--accent-11)",
          12: "var(--accent-12)",
          // Alpha variants
          a1: "var(--accent-a1)",
          a2: "var(--accent-a2)",
          a3: "var(--accent-a3)",
          a4: "var(--accent-a4)",
          a5: "var(--accent-a5)",
          a6: "var(--accent-a6)",
          a7: "var(--accent-a7)",
          a8: "var(--accent-a8)",
          a9: "var(--accent-a9)",
          a10: "var(--accent-a10)",
          a11: "var(--accent-a11)",
          a12: "var(--accent-a12)",
        },

        yellow: {
          DEFAULT: "var(--yellow-9)",
          50: "var(--yellow-1)",
          100: "var(--yellow-2)",
          200: "var(--yellow-3)",
          300: "var(--yellow-4)",
        },

        label: "var(--color-label)",
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
        contentShow: {
          from: {
            opacity: "0",
            transform: "translate(-50%, -48%) scale(0.96)",
          },
          to: {
            opacity: "1",
            transform: "translate(-50%, -50%) scale(1)",
          },
        },
        slideUpAndFade: {
          from: {
            opacity: "0",
            transform: "translateY(100%)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "content-show": "contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
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
  },
  plugins: [
    forms,
    typography,
    animate,
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
