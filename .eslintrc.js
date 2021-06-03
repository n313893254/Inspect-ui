module.exports = {
  root: true,
  env:  {
    browser: true,
    node:    true,
  },
  globals: {
    AWS: true,
  },
  parserOptions: { parser: "babel-eslint" },
  extends:       [
    "eslint:recommended",
    // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
    // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
    "plugin:vue/recommended",
    // "plugin:prettier/recommended",
  ],
  // required to lint *.vue files
  plugins: ["vue"],
  // add your custom rules here
  rules:   {
    semi:                          [2, "never"],
    "no-console":                  "off",
    "vue/max-attributes-per-line": "off",
    // "prettier/prettier": [
    //   "error",
    //   {
    //     semi:          false,
    //     "key-spacing": false,
    //   },
    // ],
    "no-unused-vars":              [
      1,
      { vars: "all", args: "after-used", ignoreRestSiblings: false },
    ],
    "key-spacing": [
      "error",
      {
        align: {
          beforeColon: false,
          afterColon:  true,
          on:          "value",
          mode:        "minimum",
        },
        multiLine: {
          beforeColon: false,
          afterColon:  true,
        },
      },
    ],
    'object-curly-spacing':         ['error', 'always'],
    'sort-key':                     ['off'],
    'vue/order-in-components':      ['off'],
    'vue/no-v-html':                ['off'],
    'vue/custom-event-name-casing': ['off'],
    'vue/no-mutating-props':        ['off'],
  },
}
