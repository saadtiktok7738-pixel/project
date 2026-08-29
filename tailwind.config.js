/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ink — warm near-black primary
        ink: {
          50: '#f7f6f4',
          100: '#eeece8',
          200: '#d9d5cd',
          300: '#b8b1a3',
          400: '#8f8775',
          500: '#6b6453',
          600: '#4d483b',
          700: '#332f26',
          800: '#1f1d18',
          900: '#131210',
          950: '#0a0908',
        },
        // Clay — warm terracotta accent
        clay: {
          50: '#fbf5f0',
          100: '#f5e7db',
          200: '#e9cdb8',
          300: '#d9aa88',
          400: '#c5825a',
          500: '#b06441',
          600: '#9a4f33',
          700: '#7e3d2b',
          800: '#5f2e22',
          900: '#3f1f17',
        },
        // Sage — muted green secondary
        sage: {
          50: '#f4f6f3',
          100: '#e6ebe3',
          200: '#ccd6c7',
          300: '#a3b69b',
          400: '#7a9470',
          500: '#5c7654',
          600: '#475d42',
          700: '#374a34',
          800: '#293829',
          900: '#1c261d',
        },
        // Cream — warm neutral background
        cream: {
          50: '#fdfcfb',
          100: '#faf8f5',
          200: '#f4f0ea',
          300: '#ebe5db',
          400: '#ddd4c6',
          500: '#c9bdab',
          600: '#ab9d87',
          700: '#8a7c67',
          800: '#6b5f4f',
          900: '#4a4136',
        },
        // Gold — premium accent for highlights
        gold: {
          50: '#fcf9f0',
          100: '#f8f0d6',
          200: '#f0dfa8',
          300: '#e6c873',
          400: '#dab049',
          500: '#c99a2e',
          600: '#a87b24',
          700: '#855e21',
          800: '#5f431d',
          900: '#3e2c15',
        },
        // Status
        success: {
          500: '#4f8a5a',
          600: '#3d6e47',
        },
        warning: {
          500: '#d4942a',
          600: '#a8731f',
        },
        error: {
          500: '#c0504a',
          600: '#9a3d39',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 2px 12px -2px rgba(19, 18, 16, 0.06), 0 1px 4px -1px rgba(19, 18, 16, 0.04)',
        card: '0 4px 24px -4px rgba(19, 18, 16, 0.08), 0 2px 8px -2px rgba(19, 18, 16, 0.04)',
        elevated: '0 12px 40px -8px rgba(19, 18, 16, 0.14), 0 4px 16px -4px rgba(19, 18, 16, 0.06)',
        inset: 'inset 0 1px 2px rgba(19, 18, 16, 0.06)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slide-down 0.25s ease-out',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        shimmer: 'shimmer 1.8s linear infinite',
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
};
