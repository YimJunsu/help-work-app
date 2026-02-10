/**
 * Electron Vite Configuration
 *
 * 빌드 최적화 설정:
 * - GZIP / Brotli 압축 (renderer)
 * - 코드 스플리팅
 * - Tree shaking
 * - Minification
 */

import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      minify: "esbuild",
      rollupOptions: {
        output: {
          // Production 빌드에서 console 제거
          manualChunks: undefined,
        },
      },
    },
    esbuild: {
      drop:
        process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
    },
  },

  preload: {
    // sandbox 모드에서는 deps를 번들링해야 함
    plugins: [],
    build: {
      minify: "esbuild",
    },
    esbuild: {
      drop:
        process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
    },
  },

  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@resources": resolve("resources"),
      },
    },

    plugins: [
      react(),

      // GZIP 압축
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: "gzip",
        ext: ".gz",
        deleteOriginFile: false,
      }),

      // Brotli 압축
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: "brotliCompress",
        ext: ".br",
        deleteOriginFile: false,
      }),
    ],

    build: {
      minify: "esbuild",
      rollupOptions: {
        output: {
          chunkFileNames: "js/[name]-[hash].js",
          entryFileNames: "js/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
        },
      },

      // 청크 크기 경고 제한 (KB)
      chunkSizeWarningLimit: 1000,

      // CSS 코드 스플리팅
      cssCodeSplit: true,

      // 프로덕션 소스맵 비활성화
      sourcemap: process.env.NODE_ENV === "production" ? false : true,
    },

    esbuild: {
      drop:
        process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
    },
  },
});
