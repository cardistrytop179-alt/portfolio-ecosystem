import { build } from 'esbuild'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

async function buildProject() {
  console.log('🔨 Сборка бэкенда...')
  
  try {
    await build({
      entryPoints: ['src/server.js'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outdir: 'dist',
      packages: 'external',
      format: 'esm',
      sourcemap: true,
      minify: process.env.NODE_ENV === 'production',
    })
    
    console.log('✅ Бэкенд собран успешно!')
  } catch (error) {
    console.error('❌ Ошибка сборки:', error)
    process.exit(1)
  }
}

buildProject()