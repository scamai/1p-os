/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'feed-in': 'feedIn 0.5s ease-out',
      },
      keyframes: {
        feedIn: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      colors: {},
      fontSize: {
        /** Dense UI type scale (Inter optimized) */
        'micro': ['0.625rem', { lineHeight: '0.875rem' }],   /* 10px — badges, metadata */
        'caption': ['0.6875rem', { lineHeight: '1rem' }],     /* 11px — labels, hints */
        'label': ['0.8125rem', { lineHeight: '1.25rem' }],    /* 13px — secondary text */
      },
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
