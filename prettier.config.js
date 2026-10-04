/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  tabWidth: 2,
  semi: true,
  singleQuote: true,

  plugins: [
    '@trivago/prettier-plugin-sort-imports',
    'prettier-plugin-tailwindcss',
  ],

  importOrder: ['<THIRD_PARTY_MODULES>', '^#.*', '^[./]'],

  // Without this the Tailwind sorter ignores classes passed to cn().
  tailwindFunctions: ['cn'],

  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderCaseInsensitive: true,
};

export default config;
