import type { Config } from 'tailwindcss';

/**
 * SKYTRACE AI design tokens.
 * Hex values match the existing dashboard so current class names keep working.
 * New components should prefer skytrace-* utilities (e.g. bg-skytrace-void).
 */
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        skytrace: {
          void: '#020810',
          header: '#020b14',
          panel: '#050f19',
          raised: '#07131e',
          ink: '#e2f1ff',
          muted: '#7dd3fc',
          cyan: '#22d3ee',
          amber: '#fbbf24',
          caution: '#f59e0b',
          fail: '#f87171',
          pass: '#34d399',
          disclaimer: '#fde68a',
          disclaimerBg: '#7c2d12',
          grid: 'rgba(56, 189, 248, 0.2)',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          '"Helvetica Neue"',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },
      boxShadow: {
        'skytrace-glow': '0 0 20px rgba(56, 189, 248, 0.4)',
        'skytrace-panel': '0 20px 40px rgba(0, 0, 0, 0.45)',
      },
      borderRadius: {
        'skytrace': '1rem',
      },
      letterSpacing: {
        'skytrace': '0.18em',
      },
    },
  },
  plugins: [],
};

export default config;
