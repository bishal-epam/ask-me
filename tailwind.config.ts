import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: '#0a0a0a',
          surface: '#141414',
          raised: '#1e1e1e',
          border: '#2a2a2a',
          'border-subtle': '#1f1f1f',
        },
        ink: {
          DEFAULT: '#f0ede8',
          secondary: '#888888',
          muted: '#4a4a4a',
          inverse: '#0a0a0a',
        },
        gold: {
          DEFAULT: '#c9a96e',
          light: '#dfc08f',
          dark: '#a8833d',
          subtle: 'rgba(201, 169, 110, 0.08)',
          'subtle-hover': 'rgba(201, 169, 110, 0.14)',
        },
        status: {
          success: '#4ade80',
          warning: '#fb923c',
          error: '#f87171',
          info: '#60a5fa',
        },
      },
      fontFamily: {
        serif: ['var(--font-instrument-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['clamp(4rem, 12vw, 10rem)', { lineHeight: '0.92', letterSpacing: '-0.03em' }],
        'display-xl': ['clamp(3rem, 8vw, 7rem)', { lineHeight: '0.95', letterSpacing: '-0.025em' }],
        'display-lg': ['clamp(2.25rem, 5vw, 4.5rem)', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(1.75rem, 3.5vw, 3rem)', { lineHeight: '1.05', letterSpacing: '-0.015em' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '8px',
        'md': '10px',
        'lg': '16px',
        'xl': '24px',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
        pulseGold: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)',
        'card-hover': '0 2px 4px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.4)',
        'glow-gold': '0 0 40px rgba(201,169,110,0.15)',
      },
    },
  },
  plugins: [],
}

export default config
