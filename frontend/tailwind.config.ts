import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#03050e', // deepest void
          900: '#050816', // main background (Deep space navy)
          850: '#080d20', // deep space surface
          800: '#0B1024', // secondary background (Midnight blue)
          750: '#0e1533', // card surface
          700: '#141d44', // elevated surface
          600: '#1f2b60', // borders and dividers
          500: '#324285', // muted borders
        },
        cyan: {
          electric: '#36D9FF', // Electric cyan accent
          glow: '#5fe0ff',
        },
        violet: {
          cosmic: '#9274FF', // Cosmic violet accent
          glow: '#ad95ff',
        },
        emerald: {
          soft: '#10B981',
        },
        amber: {
          warm: '#F59E0B',
        },
        rose: {
          soft: '#EF4444',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cosmic-glow': 'radial-gradient(ellipse at top, rgba(54, 217, 255, 0.12), transparent 70%), radial-gradient(ellipse at bottom, rgba(146, 116, 255, 0.1), transparent 70%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(20, 29, 68, 0.6) 0%, rgba(11, 16, 36, 0.75) 100%)',
      },
      boxShadow: {
        'cyan-glow': '0 0 20px -3px rgba(54, 217, 255, 0.25)',
        'violet-glow': '0 0 20px -3px rgba(146, 116, 255, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
