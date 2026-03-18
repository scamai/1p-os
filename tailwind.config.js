/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    borderRadius: {
      none: '0',
      sm: '4px',
      DEFAULT: '6px',
      md: '6px',
      lg: '8px',
      xl: '12px',
      full: '9999px',
    },
    extend: {
      colors: {
        accent: {
          DEFAULT: '#4F46E5',
          light: '#EEF2FF',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'micro': ['0.625rem', { lineHeight: '0.875rem' }],
        'caption': ['0.6875rem', { lineHeight: '1rem' }],
        'label': ['0.8125rem', { lineHeight: '1.25rem' }],
      },
      animation: {
        'feed-in': 'feedIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        feedIn: {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
