import { F, linguaType } from './fonts';
import type { TextStyle } from 'react-native';

export const typography = {
  // ─── Legacy (kept for backward compat) ────────────────────────────────────
  /** @deprecated prefer design-system tokens below for new UI */
  size: {
    xs: 12,
    sm: 13,
    md: 15,
    lg: 16,
    xl: 18,
    xxl: 30,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
  font: F,
  lingua: linguaType,

  // ─── Design System v2 — CLAUDE.md A4 ──────────────────────────────────────
  // Display: Fraunces 300 Light — başlıklar, sahne caption, NPC diyaloğu
  display: {
    fontFamily: 'Fraunces_300Light',
    letterSpacing: -0.3,
  } as TextStyle,
  displayItalic: {
    fontFamily: 'Fraunces_300Light_Italic',
    letterSpacing: -0.3,
  } as TextStyle,

  // Body: Inter Tight — UI etiketleri, butonlar, meta
  body: {
    fontFamily: 'InterTight_400Regular',
  } as TextStyle,
  bodyMedium: {
    fontFamily: 'InterTight_500Medium',
  } as TextStyle,
  button: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 15,
  } as TextStyle,
  eyebrow: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 11,
    letterSpacing: 2.6,
    textTransform: 'uppercase' as const,
  } as TextStyle,
} as const;
