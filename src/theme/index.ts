export { palette, theme, withAlpha } from './colors';

/** 8pt spacing scale — consistent rhythm per mobile UI design principles. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** Type ramp. Fraunces (display) for warmth, Public Sans (body) for clarity. */
export const type = {
  display: 'Fraunces',
  body: 'PublicSans',
  nastaliq: 'NotoNastaliq',
} as const;

/** Soft, elevation-style shadow used on primary surfaces. */
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
} as const;
