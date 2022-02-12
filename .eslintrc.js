/* eslint-disable no-undef */
module.exports = {
  root: true,
  env: {
    node: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module"
  },
  settings: {
    react: {
      version: "detect"
    }
  },
  extends: [
    // "react-app",
    "prettier",
    // "react-app/jest",
    "plugin:jest/recommended",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:promise/recommended",
    "plugin:typescript-sort-keys/recommended"
  ],
  plugins: [
    "@typescript-eslint",
    "typescript-sort-keys",
    "prettier",
    "jest",
    "promise"
  ],
  rules: {
    "promise/always-return": "off"
  },
  overrides: [
    {
      files: ["**/*.node.js", "**/*.node.ts"],
      extends: ["plugin:node/recommended"]
    }
  ]
};
