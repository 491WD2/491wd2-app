/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        household: {
          yellow: "#FFD522",
          coral: "#FF4B6C",
          magenta: "#C516E1",
          violet: "#735DFF",
          ink: "#1D1136",
          white: "#FFFFFF",
          surface: "#F8F6FF",
          muted: "#6B6280",
        },
        /** SmartHR template primary / peach surfaces (Laravel-Smarthr colors.scss) */
        smarthr: {
          primary: "#ff9b44",
          "primary-hover": "#fd8e2d",
          pink: "#fc6075",
          peach: "#fff5ec",
          sidebar: "#34444c",
          ink: "#2c3038",
          "page-bg": "#f7f7f7",
          "card-border": "#ededed",
          "plum-black": "#1f1f1f",
          "menu-muted": "#b7c0cd",
          "menu-title": "#ebebeb",
        },
        carbon: {
          950: "#080a0f",
          900: "#0e1117",
          850: "#121722",
          800: "#181e29",
          700: "#242b37",
          500: "#5b6472",
        },
      },
      boxShadow: {
        workspace: "0 14px 38px rgba(0, 0, 0, 0.28)",
      },
    },
  },
  plugins: [],
};
