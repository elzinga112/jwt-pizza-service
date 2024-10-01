import globals from "globals";
import pluginJs from "@eslint/js";

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
  pluginJs.configs.recommended,
];