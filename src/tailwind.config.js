// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.tsx",
    "./contexts/**/*.tsx",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
      colors: {
        'background': '#0a0f1e', // Dark navy/charcoal
        'surface': '#1e293b',    // slate-800
        'border': '#334155',     // slate-700
        'primary': {
          DEFAULT: '#06b6d4', // cyan-500
          'foreground': '#ffffff',
        },
        'secondary': '#475569',   // slate-600
        'accent': '#818cf8',      // indigo-400
        'text': {
          'primary': '#e2e8f0',   // slate-200
          'secondary': '#94a3b8', // slate-400
        },
      },
       boxShadow: {
        'focus-primary': '0 0 0 3px rgba(6, 182, 212, 0.4)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
       typography: (theme) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.text.secondary'),
            '--tw-prose-headings': theme('colors.text.primary'),
            '--tw-prose-lead': theme('colors.text.secondary'),
            '--tw-prose-links': theme('colors.primary.DEFAULT'),
            '--tw-prose-bold': theme('colors.text.primary'),
            '--tw-prose-counters': theme('colors.text.secondary'),
            '--tw-prose-bullets': theme('colors.primary.DEFAULT'),
            '--tw-prose-hr': theme('colors.border'),
            '--tw-prose-quotes': theme('colors.text.primary'),
            '--tw-prose-quote-borders': theme('colors.primary.DEFAULT'),
            '--tw-prose-captions': theme('colors.text.secondary'),
            '--tw-prose-code': theme('colors.accent'),
            '--tw-prose-pre-code': theme('colors.text.secondary'),
            '--tw-prose-pre-bg': theme('colors.background'),
            '--tw-prose-th-borders': theme('colors.border'),
            '--tw-prose-td-borders': theme('colors.border'),
          },
        },
      }),
    },
  },
  plugins: [
     typography,
  ],
}
