import globals from "globals";
import pluginJs from "@eslint/js";
import pluginJest from "eslint-plugin-jest"; // Import Jest plugin

export default [
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs" },
    rules: {
      "eqeqeq": "error",
      "prefer-const": "error",
      "no-var": "error",
      "no-unused-vars": "warn",
      "semi": "error"
    },
  },
  {
    languageOptions: { globals: globals.node },
    rules: {
      "no-unused-vars": "warn",
    },
  },
  {
    files: ["**/*.test.js"],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
    plugins: {
      jest: pluginJest
    },
    rules: {
      "no-unused-vars": "warn",
    },
  },
  pluginJs.configs.recommended,
];