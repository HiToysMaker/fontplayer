import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import copyPlugin from 'rollup-plugin-copy'

import electron from 'vite-plugin-electron/simple'

import { visualizer } from 'rollup-plugin-visualizer'

const isElectron = process.env.ELECTRON === 'true'

// https://vitejs.dev/config/
export default defineConfig({
  // base: '/fontplayer_demo/',
  plugins: [
    vue(),
    isElectron && electron({
      main: {
        entry: 'src/fontEditor/main/main.ts',
      },
      preload: {
        input: 'src/fontEditor/main/preload.ts',
      },
    }),
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
    rollupOptions: {
      plugins: [
        copyPlugin({
          targets: [
            { src: 'lib/**/*', dest: 'dist/lib' }
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
})
