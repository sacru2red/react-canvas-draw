import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  // demo/를 Vite 루트로 사용
  root: __dirname,
  base: './', // GitHub Pages(서브경로)에서도 상대경로로 동작
  plugins: [react()],
  server: {
    // demo가 상위 폴더의 소스(type-source)를 import 할 수 있도록 허용
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
