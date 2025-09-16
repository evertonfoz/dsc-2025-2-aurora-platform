// .eslintrc.cjs
module.exports = {
  root: true,
  env: { node: true, es2023: true, jest: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // 🔧 use APENAS o tsconfig de lint
    project: ['./tsconfig.eslint.json'],
    tsconfigRootDir: __dirname
    // remova estas linhas se existirem:
    // projectService: true,
    // allowDefaultProject: true
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:prettier/recommended'
  ],
  overrides: [
    {
      files: ['**/*.spec.ts', '**/*.e2e-spec.ts', 'test/**/*.ts', 'tests/**/*.ts'],
      env: { jest: true, node: true },
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        '@typescript-eslint/no-unsafe-call': 'warn',
        '@typescript-eslint/no-unsafe-member-access': 'warn',
        '@typescript-eslint/no-unsafe-return': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn'
      }
    }
  ],
  ignorePatterns: ['.eslintrc.cjs', 'dist', 'node_modules', 'coverage']
};
