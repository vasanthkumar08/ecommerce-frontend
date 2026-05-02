import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router-dom")) return "react";
          if (id.includes("node_modules/@reduxjs") || id.includes("node_modules/react-redux")) return "redux";
          if (id.includes("node_modules/@apollo") || id.includes("node_modules/graphql")) return "apollo";
          if (id.includes("node_modules/framer-motion") || id.includes("node_modules/react-toastify")) return "ui";
          return undefined;
        },
      },
    },
  },
})
