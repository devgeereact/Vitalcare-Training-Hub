import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Vitalcare brand tokens (from official logos)
        brand: {
          navy: "#1b2e6b",
          "navy-dark": "#142054",
          gold: "#d4a843",
          // Brand gold as *text on a light background*. #d4a843 is an accent
          // colour: at 2.2:1 on white it fails WCAG AA for anything smaller
          // than a heading, which covered every eyebrow label and "learn more"
          // link on the marketing site. This darker tone reads as the same gold
          // and clears AA at 4.96:1. Use the accent for fills, borders, icons
          // and for text on navy; use this for text on white or near-white.
          "gold-ink": "#8f6a10",
          "gold-light": "#e8c26a",
        },
        // Semantic (CSTF/CPD badges, status)
        success: "#16a34a",
        // Success green as *text*, and as a background behind white text.
        // #16a34a is 3.3:1 on white and 2.96:1 on its own 10% tint, so the
        // CSTF and CPD badges on every course card failed WCAG AA. This darker
        // tone reads as the same green and clears AA at 7.1:1 on white and
        // 6.4:1 on the tint. Same division of labour as brand gold: the
        // brighter colour for fills, borders and icons, this one for text.
        "success-ink": "#166534",
        warning: "#d97706",
      },
      fontFamily: {
        display: ['"DM Serif Display"', "serif"],
        sans: ['"DM Sans"', "sans-serif"],
      },
    },
  },
  plugins: [animate],
}

export default config
