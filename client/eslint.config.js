import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'
import boundaries from 'eslint-plugin-boundaries'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      boundaries,
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          message: 'Нарушение границ FSD: запрещён импорт из верхних слоёв',
          rules: [
            { from: ['app'], allow: ['processes', 'pages', 'features', 'entities', 'shared'] },
            { from: ['processes'], allow: ['pages', 'features', 'entities', 'shared'] },
            { from: ['pages'], allow: ['features', 'entities', 'shared'] },
            { from: ['features'], allow: ['entities', 'shared'] },
            { from: ['entities'], allow: ['shared'] },
            { from: ['shared'], allow: ['shared'] },
          ],
        },
      ],
    },
  },
])
