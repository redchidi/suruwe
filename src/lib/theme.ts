export const themes = {
  dark: {
    '--bg': '#0C0C0C',
    '--bg-raised': '#161616',
    '--bg-input': '#1E1E1E',
    '--border': '#2A2A2A',
    '--border-focus': '#C8956C',
    '--text': '#F0EDE8',
    '--text-secondary': '#9A958E',
    '--text-muted': '#6B6560',
    '--accent': '#C8956C',
    '--accent-hover': '#D4A57D',
    '--accent-muted': 'rgba(200, 149, 108, 0.12)',
    '--whatsapp': '#25D366',
    '--whatsapp-hover': '#20BD5A',
    '--danger': '#E54D4D',
    '--success': '#4DAE6D',
  },
  light: {
    '--bg': '#F7F5F2',
    '--bg-raised': '#FFFFFF',
    '--bg-input': '#EFECE7',
    '--border': '#DDD8D0',
    '--border-focus': '#9A6B45',
    '--text': '#1A1714',
    '--text-secondary': '#6B6258',
    '--text-muted': '#9A958E',
    '--accent': '#9A6B45',
    '--accent-hover': '#7D5636',
    '--accent-muted': 'rgba(154, 107, 69, 0.10)',
    '--whatsapp': '#25D366',
    '--whatsapp-hover': '#20BD5A',
    '--danger': '#D43D3D',
    '--success': '#3D9A5D',
  },
} as const;

export type Theme = keyof typeof themes;

export function applyTheme(theme: Theme): void {
  const vars = themes[theme];
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  root.setAttribute('data-theme', theme);
}
