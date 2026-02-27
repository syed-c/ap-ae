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
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable better tree-shaking
    target: 'esnext',
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 500,
    // Optimize CSS
    cssCodeSplit: true,
    cssMinify: true,
    // Use esbuild for minification (faster than terser, included with Vite)
    minify: 'esbuild',
    // Code splitting configuration
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Core React runtime
          'react-vendor': ['react', 'react-dom'],
          // Router
          'router': ['react-router-dom'],
          // State management & data fetching
          'query': ['@tanstack/react-query'],
          // UI framework
          'ui-core': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-tabs',
          ],
          // Form handling
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Animation
          'animation': ['framer-motion'],
          // Supabase
          'supabase': ['@supabase/supabase-js'],
          // Charts
          'charts': ['recharts'],
        },
        // Smaller chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },
        // Asset file names
        assetFileNames: 'assets/[name]-[hash][extname]',
        // Entry file name
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    // Source maps for debugging (disabled in production for smaller builds)
    sourcemap: mode !== 'production',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
}));
