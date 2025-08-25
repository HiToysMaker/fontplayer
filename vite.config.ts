import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import copyPlugin from 'rollup-plugin-copy'

import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  // base: '/fontplayer_demo/',
  plugins: [
    vue(),
    visualizer({
      open: true,
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      plugins: [
        copyPlugin({
          targets: [
            { src: 'lib/**/*', dest: 'dist/lib' },
            { src: 'public/overlap_wasm_bg.wasm', dest: 'dist' },
            { src: 'public/overlap_wasm.js', dest: 'dist' }
          ],
          hook: 'writeBundle',
        }),
      ]
    },
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: false,
    terserOptions: {
      compress: {
        drop_console: false // 确保不去掉 console
      }
    }
  },
  define: {
    Module: {}
  },
  optimizeDeps: {
    exclude: ['overlap_wasm']
  }
})
