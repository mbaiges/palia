/**
 * Palia Design System — Theme Tokens
 * 
 * This file defines all color tokens for light and dark themes.
 * The ThemeProvider reads these and injects them as CSS custom properties
 * onto the <html> element, which all components use via var(--token-name).
 */

export const themes = {
  light: {
    // Surfaces
    '--color-background':                '#f8f9ff',
    '--color-on-background':             '#0d1c2f',
    '--color-surface':                   '#f8f9ff',
    '--color-on-surface':                '#0d1c2f',
    '--color-on-surface-variant':        '#3f484c',
    '--color-surface-dim':               '#ccdbf4',
    '--color-surface-bright':            '#f8f9ff',
    '--color-surface-container-lowest':  '#ffffff',
    '--color-surface-container-low':     '#eff4ff',
    '--color-surface-container':         '#e6eeff',
    '--color-surface-container-high':    '#dde9ff',
    '--color-surface-container-highest': '#d5e3fd',

    // Primary (teal)
    '--color-primary':                   '#005a71',
    '--color-on-primary':                '#ffffff',
    '--color-primary-container':         '#d3f1ff',
    '--color-on-primary-container':      '#003543',

    // Secondary (sage green)
    '--color-secondary':                 '#4b6450',
    '--color-on-secondary':              '#ffffff',
    '--color-secondary-container':       '#cdead0',
    '--color-on-secondary-container':    '#516a55',

    // Tertiary
    '--color-tertiary':                  '#505355',
    '--color-on-tertiary':               '#ffffff',
    '--color-tertiary-container':        '#686b6d',
    '--color-on-tertiary-container':     '#eaecee',

    // Errors / Urgency
    '--color-error':                     '#ba1a1a',
    '--color-on-error':                  '#ffffff',
    '--color-error-container':           '#ffdad6',
    '--color-on-error-container':        '#93000a',
    '--color-alert-amber':               '#b45309',
    '--color-alert-amber-container':     '#fef3c7',
    '--color-on-amber-container':        '#78350f',

    // Outlines
    '--color-outline':                   '#6f787d',
    '--color-outline-variant':           '#bec8cd',

    // Secondary-fixed (used for caregiver cards etc)
    '--color-secondary-fixed':           '#cdead0',
    '--color-on-secondary-fixed-variant': '#516a55',
  },

  dark: {
    // Surfaces — Nocturnal Clarity palette
    '--color-background':                '#131313',
    '--color-on-background':             '#e5e2e1',
    '--color-surface':                   '#131313',
    '--color-on-surface':                '#e5e2e1',
    '--color-on-surface-variant':        '#bbc9cd',
    '--color-surface-dim':               '#131313',
    '--color-surface-bright':            '#393939',
    '--color-surface-container-lowest':  '#0e0e0e',
    '--color-surface-container-low':     '#1c1b1b',
    '--color-surface-container':         '#201f1f',
    '--color-surface-container-high':    '#2a2a2a',
    '--color-surface-container-highest': '#353534',

    // Primary — vibrant cyan
    '--color-primary':                   '#22d3ee',
    '--color-on-primary':                '#00363e',
    '--color-primary-container':         '#004e5a',
    '--color-on-primary-container':      '#a2eeff',

    // Secondary — muted blue-slate
    '--color-secondary':                 '#bec6e0',
    '--color-on-secondary':              '#283044',
    '--color-secondary-container':       '#3f465c',
    '--color-on-secondary-container':    '#adb4ce',

    // Tertiary
    '--color-tertiary':                  '#d2ddf5',
    '--color-on-tertiary':               '#263143',
    '--color-tertiary-container':        '#b6c1d9',
    '--color-on-tertiary-container':     '#444f63',

    // Errors / Urgency — softened for dark backgrounds
    '--color-error':                     '#ffb4ab',
    '--color-on-error':                  '#690005',
    '--color-error-container':           '#93000a',
    '--color-on-error-container':        '#ffdad6',
    '--color-alert-amber':               '#fbbf24',
    '--color-alert-amber-container':     '#451a03',
    '--color-on-amber-container':        '#fef3c7',

    // Outlines
    '--color-outline':                   '#859397',
    '--color-outline-variant':           '#3c494c',

    // Secondary-fixed
    '--color-secondary-fixed':           '#3f465c',
    '--color-on-secondary-fixed-variant': '#bec6e0',
  },
};

/**
 * Apply a theme by injecting its tokens as CSS custom properties on :root.
 * @param {'light'|'dark'} themeName
 */
export function applyTheme(themeName) {
  const tokens = themes[themeName] || themes.light;
  const root = document.documentElement;

  // Set or remove the dark class for non-token based CSS selectors
  if (themeName === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }

  // Inject tokens as CSS variables
  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Persist
  try {
    localStorage.setItem('palia_theme', themeName);
  } catch (_) {}
}

/**
 * Read the persisted theme preference, defaulting to 'light'.
 * @returns {'light'|'dark'}
 */
export function getStoredTheme() {
  try {
    const stored = localStorage.getItem('palia_theme');
    if (stored === 'dark' || stored === 'light') return stored;
    // Respect OS preference as fallback
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch (_) {}
  return 'light';
}
