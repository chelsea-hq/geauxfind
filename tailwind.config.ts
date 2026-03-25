import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bayou: {
          deep: "#1a3a2a",
          moss: "#4a7c59",
          spanish: "#8b9a7d",
        },
        cajun: {
          red: "#c41e3a",
          gold: "#e8a838",
        },
        cream: "#faf7f2",
        castiron: "#2d2926",
      },
      borderRadius: {
        sm: "8px",
        md: "10px",
        lg: "12px",
      },
    },
  },
};

export default config;
