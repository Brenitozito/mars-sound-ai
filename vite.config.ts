import { defineConfig, loadEnv, type Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { seoFiles } from './vite/seoFiles'

// `figma:asset/<file>` is a Figma Make virtual protocol. Locally, resolve it to
// `src/assets/<file>` when present, otherwise to a placeholder image.
function figmaAssets(): Plugin {
  const prefix = 'figma:asset/'
  const virtualPrefix = '\0' + prefix
  const assetsDir = path.resolve(__dirname, './src/assets')
  const placeholder =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a1b4a"/><stop offset="1" stop-color="#0f0c1d"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>',
    )

  return {
    name: 'figma-assets',
    enforce: 'pre',
    resolveId(id) {
      if (!id.startsWith(prefix)) return null
      const file = path.join(assetsDir, id.slice(prefix.length))
      return fs.existsSync(file) ? file : virtualPrefix + id.slice(prefix.length)
    },
    load(id) {
      if (id.startsWith(virtualPrefix)) {
        return `export default ${JSON.stringify(placeholder)}`
      }
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    figmaAssets(),
    seoFiles(loadEnv(mode, __dirname, 'VITE_').VITE_SITE_URL),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Vendor code changes far less often than app code; isolating it keeps the
  // browser cache valid across deploys.
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules[\\/](react|react-dom|react-router|scheduler|cookie|set-cookie-parser)[\\/]/.test(id)) {
            return 'vendor-react'
          }
          if (/node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) {
            return 'vendor-motion'
          }
          if (/node_modules[\\/]@supabase[\\/]/.test(id)) {
            return 'vendor-supabase'
          }
          return undefined
        },
      },
    },
  },
}))
