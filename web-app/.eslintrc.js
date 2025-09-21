module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Code Quality Rules
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',

    // Security Rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',

    // Style Rules
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'indent': ['error', 2],
    'comma-dangle': ['error', 'always-multiline'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'computed-property-spacing': ['error', 'never'],
    'func-call-spacing': ['error', 'never'],
    'key-spacing': ['error', { beforeColon: false, afterColon: true }],
    'keyword-spacing': ['error', { before: true, after: true }],
    'space-before-blocks': ['error', 'always'],
    'space-before-function-paren': ['error', 'never'],
    'space-in-parens': ['error', 'never'],
    'space-infix-ops': 'error',
    'space-unary-ops': 'error',

    // Error Prevention
    'no-undef': 'error',
    'no-redeclare': 'error',
    'no-duplicate-imports': 'error',
    'no-template-curly-in-string': 'error',
    'valid-typeof': 'error',

    // Best Practices
    'eqeqeq': ['error', 'always'],
    'no-floating-decimal': 'error',
    'no-multi-spaces': 'error',
    'no-trailing-spaces': 'error',
    'eol-last': 'error',
    'no-multiple-empty-lines': ['error', { max: 2 }],
    'padded-blocks': ['error', 'never'],
    'brace-style': ['error', '1tbs'],
    'comma-style': ['error', 'last'],
    'dot-location': ['error', 'property'],
    'handle-callback-err': 'error',
    'no-new-require': 'error',
    'no-path-concat': 'error',
    'no-sync': 'warn', // Allow sync in development, warn in production
  },
  overrides: [
    {
      files: ['**/*.test.js', 'tests/**/*.js'],
      rules: {
        'no-console': 'off',
        'no-unused-vars': 'off',
        'prefer-arrow-callback': 'off',
      },
    },
    {
      files: ['src/utils/**/*.js'],
      rules: {
        'no-console': 'off', // Utilities might need console methods
      },
    },
  ],
};
