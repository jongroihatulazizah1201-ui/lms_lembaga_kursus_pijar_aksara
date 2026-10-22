/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#ffdf0f',
          yellowHover: '#eacb0d',
          purple: '#843bab',
          purpleLight: '#f6edfb',
          purpleBorder: 'rgba(132, 59, 171, 0.3)',
        },
      },
    },
  },
  plugins: [],
};
