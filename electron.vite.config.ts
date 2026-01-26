/**
 * Electron Vite Configuration
 *
 * 빌드 최적화 설정:
 * - GZIP 압축 (renderer 프로세스)
 * - 코드 스플리팅
 * - Tree shaking
 * - Minification
 */

import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      minify: 'esbuild',
      rollupOptions: {
        output: {
          // Production 빌드에서 console 제거
          manualChunks: undefined
        }
      }
    },
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
    }
  },
  preload: {
    // Don't externalize deps in preload when using sandbox mode
    // All dependencies must be bundled for sandbox to work
    plugins: [],
    build: {
      minify: 'esbuild'
    },
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      react(),
      // GZIP 압축 플러그인
      viteCompression({
        verbose: true,              // 압축 결과 로그 출력
        disable: false,             // 압축 활성화
        threshold: 10240,           // 10KB 이상 파일만 압축
        algorithm: 'gzip',          // gzip 알고리즘 사용
        ext: '.gz',                 // .gz 확장자
        deleteOriginFile: false     // 원본 파일 유지
      }),
      // Brotli 압축 (더 높은 압축률)
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'brotliCompress', // Brotli 알고리즘
        ext: '.br',
        deleteOriginFile: false
      })
    ],
    build: {
      minify: 'esbuild',
      // 청크 분할 전략
      rollupOptions: {
        output: {
          // 벤더 라이브러리 분리
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // React 관련
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react'
              }
              // UI 라이브러리
              if (id.includes('@radix-ui')) {
                return 'vendor-ui'
              }
              // Chart.js
              if (id.includes('chart.js') || id.includes('react-chartjs')) {
                return 'vendor-chart'
              }
              // 날짜 처리
              if (id.includes('date-fns')) {
                return 'vendor-date'
              }
              // 아이콘
              if (id.includes('lucide-react')) {
                return 'vendor-icons'
              }
              // 나머지 벤더
              return 'vendor-other'
            }
          },
          // 에셋 파일명 패턴
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      },
      // 청크 크기 경고 제한 (KB)
      chunkSizeWarningLimit: 1000,
      // CSS 코드 스플리팅
      cssCodeSplit: true,
      // 소스맵 비활성화 (프로덕션)
      sourcemap: process.env.NODE_ENV === 'production' ? false : true
    },
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
      // Tree shaking 최적화
      treeShaking: true,
      // 최소화 옵션
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true
    }
  }
})
