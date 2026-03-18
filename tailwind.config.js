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
        sans: ['var(--font-body)', 'Instrument Sans', 'system-ui', 'sans-serif'],
        heading: ['var(--font-display)', 'Cormorant Garamond', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'Space Grotesk', 'monospace'],
      },
      fontSize: {
        'micro': ['0.625rem', { lineHeight: '0.875rem' }],
        'caption': ['0.6875rem', { lineHeight: '1rem' }],
        'label': ['0.8125rem', { lineHeight: '1.25rem' }],
      },
      spacing: {
        'xs': '8px',
        'sm-space': '16px',
        'md-space': '24px',
        'lg-space': '32px',
        'xl-space': '48px',
        '2xl-space': '80px',
        '3xl-space': '120px',
      },
      maxWidth: {
        'content': '900px',
        'page': '1400px',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(.16, 1, .3, 1)',
        'in-out-smooth': 'cubic-bezier(.65, 0, .35, 1)',
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
