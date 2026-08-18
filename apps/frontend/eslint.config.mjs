import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default tseslint.config(
  {
    ignores: [".next/", "node_modules/", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        // Monorepo: root repo punya tsconfig di tiap app (backend & frontend).
        // Tanpa tsconfigRootDir eksplisit, typescript-eslint infer dari kandidat
        // tsconfig yang bisa lebih dari satu dalam satu proses lint (editor),
        // lalu melempar "multiple candidate TSConfigRootDirs".
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    rules: {
      // Codebase existing memakai `any` & punya unused vars secara luas.
      // Dibuat warning agar tidak memblokir `next build` (deploy) —
      // tetap terlihat di editor/CI untuk dibersihkan bertahap.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  prettier
);
