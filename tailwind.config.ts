import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#0070F3',
          hover: '#005DD1',
          light: '#EBF3FF',
          border: '#B3D4FC',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#ECFDF5',
          border: '#6EE7B7',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FFFBEB',
        },
        border: {
          DEFAULT: '#EAEAEA',
          strong: '#D1D5DB',
        },
        surface: {
          DEFAULT: '#FAFAFA',
          hover: '#F3F4F6',
        },
        fg: {
          DEFAULT: '#111111',
          2: '#555555',
          3: '#888888',
          inverse: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: [
          'Pretendard Variable',
          'Pretendard',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.4' }],
        sm: ['0.8125rem', { lineHeight: '1.6' }],
        base: ['1.0625rem', { lineHeight: '1.7' }],
        md: ['1.125rem', { lineHeight: '1.6' }],
        lg: ['1.25rem', { lineHeight: '1.6' }],
        xl: ['1.5rem', { lineHeight: '1.4' }],
        '2xl': ['1.8rem', { lineHeight: '1.4' }],
        '3xl': ['2.25rem', { lineHeight: '1.25' }],
        '4xl': ['2.5rem', { lineHeight: '1.25' }],
      },
      lineHeight: { relaxed: '1.7' },
      maxWidth: { content: '1080px' },
      height: { header: '56px' },
      boxShadow: {
        xs: '0 1px 2px rgba(0,0,0,0.05)',
        sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        md: '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)',
        lg: '0 10px 15px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.03)',
        focus: '0 0 0 3px rgba(0,112,243,0.25)',
        'card-hover': '0 4px 16px rgba(0,112,243,0.1)',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        lg: '12px',
        full: '9999px',
      },
      keyframes: {
        'hero-progress': {
          from: { width: '0%' },
          to: { width: '100%' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'hero-progress': 'hero-progress 5.5s linear forwards',
        'fade-in': 'fade-in 0.3s ease forwards',
      },
    },
  },
  plugins: [],
}

export default config
