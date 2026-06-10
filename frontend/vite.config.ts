import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [devtools(), tanstackStart(), viteReact(), basicSsl()],
  server: {
    port: 8008,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8009',
        changeOrigin: true,
      },
    },
  },
})

export default config
