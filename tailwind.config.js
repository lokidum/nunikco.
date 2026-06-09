/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scan every HTML file in the repo so unused classes are dropped.
  content: [
    './*.html',
    './services/**/*.html',
    './industries/**/*.html',
    './locations/**/*.html'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'on-background': '#e1e2e8',
        'surface-bright': '#36393e',
        'surface-dim': '#111417',
        'error-container': '#93000a',
        'on-primary': '#5b1b07',
        'inverse-primary': '#974730',
        'on-secondary-container': '#9abbbb',
        'background': '#111417',
        'surface-container': '#1d2024',
        'outline': '#a28c86',
        'surface-container-high': '#272a2e',
        'tertiary': '#c4c7ca',
        'on-secondary-fixed': '#002020',
        'on-error-container': '#ffdad6',
        'tertiary-fixed-dim': '#c4c7ca',
        'on-secondary-fixed-variant': '#2c4c4c',
        'on-secondary': '#143536',
        'on-primary-container': '#fffdff',
        'tertiary-container': '#727679',
        'inverse-surface': '#e1e2e8',
        'on-tertiary': '#2d3133',
        'primary-fixed-dim': '#ffb5a0',
        'inverse-on-surface': '#2e3135',
        'tertiary-fixed': '#e0e3e6',
        'on-tertiary-fixed': '#181c1e',
        'on-tertiary-container': '#fefeff',
        'on-surface': '#e1e2e8',
        'error': '#ffb4ab',
        'primary': '#ffb5a0',
        'primary-fixed': '#ffdbd1',
        'on-primary-fixed': '#3b0900',
        'primary-container': '#b35d44',
        'on-surface-variant': '#dbc1ba',
        'surface-tint': '#ffb5a0',
        'secondary-fixed': '#c6e9e9',
        'secondary-container': '#2c4c4c',
        'on-primary-fixed-variant': '#78301b',
        'surface-variant': '#323539',
        'surface-container-lowest': '#0b0e12',
        'secondary': '#abcdcd',
        'surface-container-low': '#191c20',
        'secondary-fixed-dim': '#abcdcd',
        'on-error': '#690005',
        'surface-container-highest': '#323539',
        'outline-variant': '#55433e',
        'on-tertiary-fixed-variant': '#43474a',
        'surface': '#111417'
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        lg: '0.25rem',
        xl: '0.5rem',
        full: '0.75rem'
      },
      fontFamily: {
        headline: ['Newsreader', 'serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif']
      }
    }
  }
};
