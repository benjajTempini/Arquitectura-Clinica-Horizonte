/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        aquamarine: {
          light: '#76eec6',
          dark: '#458b74',
        },
        horizonte: {
          50: '#f0fdf9',
          100: '#e6faf4',
          200: '#c2f5e5',
          300: '#76eec6', // Aquamarine luminoso
          400: '#5cdbb1',
          500: '#458b74', // Aquamarine clínico institucional
          600: '#397662',
          700: '#2e604f',
          800: '#254d40',
          900: '#1b372e',
        },
      },
    },
  },
  plugins: [],
};
