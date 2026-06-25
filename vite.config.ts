import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 部署到子路径时修改这里（如 /bigscreen/）
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
