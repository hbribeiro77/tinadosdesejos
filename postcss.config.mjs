const vitest = process.env.VITEST === "true";

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: vitest ? [] : ["@tailwindcss/postcss"],
};

export default config;
