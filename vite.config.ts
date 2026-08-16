import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // O bundle inicial já fica em ~1,1 MB (344 kB gzip) graças ao lazy loading
    // das rotas; o aviso padrão de 500 kB só produziria ruído no build.
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // React muda a cada poucos meses, o código do app muda a cada deploy.
        // Separá-los faz o navegador reaproveitar o React entre releases.
        //
        // Só o React é separado de propósito: agrupar bibliotecas usadas apenas
        // por rotas lazy (recharts, por exemplo) fazia o Rollup prender o
        // helper de preload dentro daquele chunk, e o entry passava a
        // pré-carregar 410 kB de gráficos em toda primeira visita.
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
}));
