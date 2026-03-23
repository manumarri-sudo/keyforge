/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/web/**/*.{html,tsx,ts}'],
  theme: {
    extend: {
      colors: {
        background: '#09090b',    // zinc-950
        card: '#18181b',          // zinc-900
        'card-border': '#27272a', // zinc-800
        accent: '#10b981',        // emerald-500
        warning: '#eab308',       // yellow-500
        'text-primary': '#f4f4f5',   // zinc-100
        'text-secondary': '#a1a1aa', // zinc-400
      },
    },
  },
  plugins: [],
};
