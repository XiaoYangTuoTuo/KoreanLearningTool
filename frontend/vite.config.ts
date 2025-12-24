import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  build: {
    sourcemap: true, // Enable sourcemap for debugging
    minify: false,   // Disable minify to see readable errors
    chunkSizeWarningLimit: 1000,
    // Remove manualChunks to rely on Vite's default splitting and avoid circular dependency issues
  },
  plugins: [
    react({
      babel: {
        plugins: [
          // Only use react-dev-locator in development
          ...(mode === 'development' ? ['react-dev-locator'] : []),
        ],
      },
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
    tsconfigPaths()
  ],
}))
