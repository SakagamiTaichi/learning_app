import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist", // ビルド出力ディレクトリ
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for large third-party libraries
          vendor: ['react', 'react-dom'],
          // MUI chunk for Material-UI components
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          // Firebase chunk for Firebase services
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Router chunk for React Router
          router: ['react-router-dom']
        }
      }
    },
    chunkSizeWarningLimit: 600 // Increase warning limit to 600kb
  },
});
