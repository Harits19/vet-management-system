import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["dist/", "node_modules/"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        // Monorepo: root repo punya tsconfig di tiap app (backend & frontend).
        // Tanpa tsconfigRootDir eksplisit, typescript-eslint infer dari kandidat
        // tsconfig yang bisa lebih dari satu dalam satu proses lint (editor),
        // lalu melempar "multiple candidate TSConfigRootDirs".
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },
  },
  prettier
);
