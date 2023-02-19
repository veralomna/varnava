import { defineConfig, loadEnv } from "vite"
import vue from "@vitejs/plugin-vue-jsx"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [vue()],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    },

    logLevel: "silent"
  }
})
