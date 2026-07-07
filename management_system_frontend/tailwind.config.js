/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          focus: "var(--color-primary-focus)",
          "on-dark": "var(--color-primary-on-dark)",
        },
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        neutral: "var(--color-neutral)",
        ink: "var(--color-ink)",
        background: "var(--color-background)",
        surface: {
          DEFAULT: "var(--color-surface)",
          pearl: "var(--color-surface-pearl)",
        },
        parchment: "var(--color-canvas-parchment)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        "text-on-dark": "var(--color-text-on-dark)",
        border: {
          DEFAULT: "var(--color-border)",
          light: "var(--color-border-light)",
        },
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        sidebar: {
          DEFAULT: "var(--color-sidebar)",
          foreground: "var(--color-sidebar-foreground)",
          active: "var(--color-sidebar-active)",
          "active-text": "var(--color-sidebar-active-text)",
          muted: "var(--color-sidebar-muted)",
          border: "var(--color-sidebar-border)",
        },
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        pill: "var(--radius-pill)",
        card: "var(--radius-card)",
        button: "var(--radius-button)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        product: "var(--shadow-product)",
      },
      fontSize: {
        body: ["17px", { lineHeight: "1.47", letterSpacing: "-0.374px" }],
        caption: ["14px", { lineHeight: "1.43", letterSpacing: "-0.224px" }],
        "caption-strong": [
          "14px",
          { lineHeight: "1.29", letterSpacing: "-0.224px", fontWeight: "600" },
        ],
        tagline: ["21px", { lineHeight: "1.19", letterSpacing: "0.231px" }],
      },
    },
  },
  plugins: [],
};
