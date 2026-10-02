import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const inDocker = !!process.env.IN_DOCKER;

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: inDocker ? { usePolling: true } : undefined,
    hmr: inDocker ? { clientPort: 8080 } : undefined,
  },
});
