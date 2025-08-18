module.exports = {
  root: true,
  env: {
    es6: true,
    node: true, // Добавляем поддержку Node.js
  },
  extends: [
    "eslint:recommended",
  ],
  rules: {
    "quotes": ["error", "double"],
    "indent": ["error", 2],
    "object-curly-spacing": ["error", "always"],
    "max-len": ["error", { "code": 120 }],
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
};