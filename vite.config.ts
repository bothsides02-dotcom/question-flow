import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHubリポジトリ名が question-flow の場合はこのままでOKです。
// リポジトリ名を変える場合は "/リポジトリ名/" に変更してください。
// username.github.io という名前のリポジトリなら base は "/" にします。
export default defineConfig({
  plugins: [react()],
  base: "/question-flow/",
});