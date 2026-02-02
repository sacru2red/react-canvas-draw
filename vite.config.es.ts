import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require("./package.json") as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const external = [
  ...Object.keys(pkg.peerDependencies ?? {}),
  ...Object.keys(pkg.dependencies ?? {}),
];

export default defineConfig({
  plugins: [
    react({
      // nwb가 생성하던 UMD 번들과의 호환을 위해 classic JSX를 유지
      jsxRuntime: "classic",
    }),
  ],
  esbuild: {
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
  },
  build: {
    outDir: "es",
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "type-source/index.ts"),
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: (id) => external.includes(id) || id.startsWith("react/"),
      output: {
        exports: "named",
        // 단일 엔트리 파일로 번들링 (Vite 7에서 preserveModulesRoot 경로 이슈 회피)
        inlineDynamicImports: true,
      },
    },
  },
});
