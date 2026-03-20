import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueRouter from 'vue-router/vite'
import vueLayouts from 'vite-plugin-vue-layouts'
import vueDevtools from 'vite-plugin-vue-devtools'
import ui from '@nuxt/ui/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE || '/'
  console.log(`[Vite Config] Mode: ${mode}, Base: ${base}`)
  return defineConfig({
  base,
  plugins: [
    vueRouter({
      dts: 'src/route-map.d.ts'
    }),
    vueLayouts(),
    vueDevtools(),
    vue(),
    ui({
      ui: {
        colors: {
          primary: 'blue',
          neutral: 'zinc'
        }
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8049',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
  })
})
