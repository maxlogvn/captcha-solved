import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],   // hỗ trợ cả require và import
  dts: true,                // tạo file .d.ts
  clean: true,
  sourcemap: true,
  minify: true
});
