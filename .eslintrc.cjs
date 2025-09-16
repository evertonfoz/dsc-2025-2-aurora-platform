// .eslintrc.cjs
module.exports = {
  root: true,
  env: { node: true, es2023: true, jest: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.eslint.json'],
    tsconfigRootDir: __dirname,
    // opcional, melhora performance quando project é usado
    projectService: true
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    // usa regras com type-check; requer parserOptions.project
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    // integra o prettier e desativa conflitos
    'plugin:prettier/recommended'
  ],
  overrides: [
    {
      files: ['**/*.spec.ts', '**/*.e2e-spec.ts', 'test/**/*.ts', 'tests/**/*.ts'],
      env: { jest: true, node: true },
      rules: {
        // flexibiliza nos testes (evita falsos positivos que já vimos)
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ],
  ignorePatterns: ['.eslintrc.cjs', 'dist', 'node_modules', 'coverage']
};
