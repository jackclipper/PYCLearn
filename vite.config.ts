import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // 相对资源路径兼容独立域名及 GitHub Pages 的 /仓库名/ 路径。
  base: "./",
  plugins: [react()],
});
