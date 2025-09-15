// .eslintrc.cjs
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.eslint.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  // Mantém o lint forte no código de app
  overrides: [
    {
      // Inclui unit/integration e E2E explícito
      files: ['**/*.spec.ts', '**/*.e2e-spec.ts', 'test/**/*.ts'],
      env: { jest: true, node: true },
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
      },
    },
  ],
  ignorePatterns: ['.eslintrc.cjs'],
};
