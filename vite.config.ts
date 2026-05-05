import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import tailwindPostcss from "@tailwindcss/postcss";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      // 1. Vercel Serverless Functions (Port 3000)
      // List the specific files from your /api folder
      '/api/fixed-deposit': { target: 'http://localhost:3000', changeOrigin: true },
      '/api/update-profile': { target: 'http://localhost:3000', changeOrigin: true },
      '/api/auth-login': { target: 'http://localhost:3000', changeOrigin: true },
      '/api/auth-register': { target: 'http://localhost:3000', changeOrigin: true },
      '/api/approve-instalment': { target: 'http://localhost:3000', changeOrigin: true },
      '/api/approve-member': { target: 'http://localhost:3000', changeOrigin: true },
      '/api/delete-member': { target: 'http://localhost:3000', changeOrigin: true },
      '/api/deactivate-member': { target: 'http://localhost:3000', changeOrigin: true },
      '/api/freeze-member': { target: 'http://localhost:3000', changeOrigin: true },
      '/api/submit-instalment': { target: 'http://localhost:3000', changeOrigin: true },
      '/api/send-email': { target: 'http://localhost:3000', changeOrigin: true },
      '/api/transactions': { target: 'http://localhost:3000', changeOrigin: true },
      '/api/calculate-member-settlement': { target: 'http://localhost:5000', changeOrigin: true },

      // 2. Catch-all for any remaining Express routes (Port 5000)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    },
  },
  css: {
    postcss: {
      plugins: [tailwindPostcss()],
    },
  },
});