module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    // Without this ESLint cannot parse JSX, so every .jsx file failed with
    // "Parsing error: Unexpected token <" and `npm run lint` reported 82
    // errors that had nothing to do with the code.
    ecmaFeatures: { jsx: true },
  },
  settings: {
    // Silences the "React version not specified" warning and lets the plugin
    // apply rules matching the installed version.
    react: { version: 'detect' },
  },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // The automatic JSX runtime makes an explicit React import unnecessary.
    'react/react-in-jsx-scope': 'off',
    // This codebase does not declare propTypes; enabling the rule would report
    // thousands of violations without finding real defects.
    'react/prop-types': 'off',
  },
};
