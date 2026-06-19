import { Platform } from 'react-native';

export const C = {
  purple: '#534AB7',
  gold:   '#EF9F27',
  green:  '#1D9E75',
  red:    '#E24B4A',
  border: 'rgba(255,255,255,0.08)',
  radius: { sm: 8, md: 12, lg: 16, xl: 20, pill: 99 },
} as const;

export const Colors = {
  light: {
    text:               '#1a1a2e',
    background:         '#F2F0FC',
    backgroundElement:  '#E4E1F5',
    backgroundSelected: '#CEC9EE',
    textSecondary:      '#534AB7',
  },
  dark: {
    text:               '#E8E6FF',
    background:         '#0d0d1e',
    backgroundElement:  '#1a1a2e',
    backgroundSelected: '#26215C',
    textSecondary:      '#9B97D4',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
