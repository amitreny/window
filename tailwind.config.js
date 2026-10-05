import plugin from 'tailwindcss/plugin'

// Tokens exported by Stitch (design/stitch/DESIGN.md). Colours are exposed as CSS
// variables so the dark palette can swap them without touching component classes.
const light = {
  'surface': '#fcf9f8',
  'surface-dim': '#dcd9d9',
  'surface-bright': '#fcf9f8',
  'surface-container-lowest': '#ffffff',
  'surface-container-low': '#f6f3f2',
  'surface-container': '#f0eded',
  'surface-container-high': '#eae7e7',
  'surface-container-highest': '#e5e2e1',
  'surface-variant': '#e5e2e1',
  'surface-tint': '#006a63',
  'background': '#fcf9f8',
  'on-background': '#1c1b1b',
  'on-surface': '#1c1b1b',
  'on-surface-variant': '#3e4947',
  'inverse-surface': '#313030',
  'inverse-on-surface': '#f3f0ef',
  'outline': '#6e7977',
  'outline-variant': '#bdc9c6',
  'primary': '#005c55',
  'on-primary': '#ffffff',
  'primary-container': '#0f766e',
  'on-primary-container': '#a3faef',
  'inverse-primary': '#80d5cb',
  'primary-fixed': '#9cf2e8',
  'primary-fixed-dim': '#80d5cb',
  'on-primary-fixed': '#00201d',
  'on-primary-fixed-variant': '#00504a',
  'secondary': '#904d00',
  'on-secondary': '#ffffff',
  'secondary-container': '#fe932c',
  'on-secondary-container': '#663500',
  'secondary-fixed': '#ffdcc3',
  'secondary-fixed-dim': '#ffb77d',
  'on-secondary-fixed': '#2f1500',
  'on-secondary-fixed-variant': '#6e3900',
  'tertiary': '#9a2700',
  'on-tertiary': '#ffffff',
  'tertiary-container': '#be3c14',
  'on-tertiary-container': '#ffe5de',
  'tertiary-fixed': '#ffdbd1',
  'tertiary-fixed-dim': '#ffb5a0',
  'on-tertiary-fixed': '#3b0900',
  'on-tertiary-fixed-variant': '#872100',
  'error': '#ba1a1a',
  'on-error': '#ffffff',
  'error-container': '#ffdad6',
  'on-error-container': '#93000a',
}

// Navy palette from the Stitch stargazing variant.
const dark = {
  'surface': '#0b1220',
  'surface-bright': '#0b1220',
  'background': '#0b1220',
  'surface-container-lowest': '#131e33',
  'surface-container-low': '#16243d',
  'surface-container': '#1e2e4a',
  'surface-container-high': '#243452',
  'surface-container-highest': '#2b3d5e',
  'on-background': '#f1f5f9',
  'on-surface': '#f1f5f9',
  'on-surface-variant': '#94a3b8',
  'outline': '#64748b',
  'outline-variant': '#334155',
  'primary': '#14b8a6',
  'on-primary': '#04201d',
  'secondary': '#ffb77d',
  'tertiary': '#e4572e',
  'tertiary-fixed': '#4a1608',
  'on-tertiary-fixed-variant': '#ffb5a0',
}

const channels = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return `${n >> 16} ${(n >> 8) & 255} ${n & 255}`
}
const vars = (palette) =>
  Object.fromEntries(Object.entries(palette).map(([name, hex]) => [`--c-${name}`, channels(hex)]))

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: Object.fromEntries(
        Object.keys(light).map((name) => [name, `rgb(var(--c-${name}) / <alpha-value>)`]),
      ),
      borderRadius: { DEFAULT: '0.25rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
      spacing: {
        'space-xs': '0.375rem',
        'space-sm': '0.75rem',
        'space-md': '1.25rem',
        'space-lg': '2rem',
        'space-xl': '3rem',
        'gutter': '1.25rem',
      },
      fontFamily: { sans: ['Manrope', 'system-ui', 'sans-serif'] },
      fontSize: {
        'display-hero-mobile': ['3.5rem', { lineHeight: '0.95', letterSpacing: '-0.04em', fontWeight: '800' }],
        'headline-lg-mobile': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.025em', fontWeight: '700' }],
        'headline-md': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-sm': ['1.125rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '-0.005em', fontWeight: '400' }],
        'body-md': ['0.9375rem', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '400' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.45', letterSpacing: '0em', fontWeight: '400' }],
        'label-lg': ['0.875rem', { lineHeight: '1', letterSpacing: '0.02em', fontWeight: '600' }],
        'label-md': ['0.75rem', { lineHeight: '1', letterSpacing: '0.04em', fontWeight: '600' }],
        'numeral-score-mobile': ['2.5rem', { lineHeight: '0.9', letterSpacing: '-0.045em', fontWeight: '800' }],
      },
      boxShadow: {
        card: '0 6px 24px -4px rgba(26,26,26,0.04), 0 2px 6px -1px rgba(26,26,26,0.02)',
      },
    },
  },
  plugins: [plugin(({ addBase }) => addBase({ ':root': vars(light), '.dark': vars(dark) }))],
}
