import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Sur GitHub Pages le site est servi sous /organisation-tournoi/
const base = process.env.GITHUB_PAGES === "true" ? "/organisation-tournoi/" : "/";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
});
