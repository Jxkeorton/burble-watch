
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import path from 'path';

const tsconfigRootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname));

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
      globals: {
        ...globals.node
      }
    },
  },
);