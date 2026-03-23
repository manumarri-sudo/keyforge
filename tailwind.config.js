/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/web/**/*.{html,tsx,ts}'],
  theme: {
    extend: {
      colors: {
        background: '#fafafa',
        card: '#ffffff',
        'card-border': '#e5e7eb',
        accent: '#059669',
        'accent-light': '#d1fae5',
        warning: '#d97706',
        'text-primary': '#111827',
        'text-secondary': '#6b7280',
      },
    },
  },
  plugins: [],
};
