import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/", // Changed from "/" to "./" for relative paths
  plugins: [react()],
  resolve: {
    extensions: [".js", ".jsx"],
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    chunkSizeWarningLimit: 2000, // Set limit to 1000 kB
    emptyOutDir: true,
    manifest: true,
    assetsInlineLimit: 0, // Force asset copying
    copyPublicDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
        },
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://5.16.255.254:4000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/admin": {
        target: "http://5.16.255.254:4000",
        changeOrigin: true,
      },
    },
  },
});

// LOCALHOST ******************

// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     extensions: [".js", ".jsx"],
//   },
//   server: {
//     port: 3000,

//     proxy: {
//       "/api": {
//         target: "http://localhost:8000",
//         changeOrigin: true,
//         rewrite: (path) => path.replace(/^\/api/, ""),
//       },
//     },
//     // proxy: {
//     //   "/api": {
//     //     target: "http://5.16.255.254:4000",
//     //     changeOrigin: true,
//     //     rewrite: (path) => path.replace(/^\/api/, ""),
//     //   },
//     // },
//   },
// });
