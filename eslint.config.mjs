import globals from "globals";
export default [
  {
    files: ["**/*.mjs"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { "no-undef": "error", "no-unused-vars": "error" },
  },
];
