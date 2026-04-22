import type { TextStyle } from 'react-native';

/** Poppins — global UI font (Lingua-style hierarchy). */
export const F = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

/**
 * Lingua typography scale: H1–H3, Title1–2, Caption, Description.
 * Weights: Bold / SemiBold / Medium / Regular map to Poppins.
 */
export const linguaType = {
  heading1: { fontFamily: F.bold, fontSize: 32, lineHeight: 40 } satisfies TextStyle,
  heading2: { fontFamily: F.bold, fontSize: 26, lineHeight: 32 } satisfies TextStyle,
  heading3: { fontFamily: F.semibold, fontSize: 22, lineHeight: 28 } satisfies TextStyle,
  title1: { fontFamily: F.semibold, fontSize: 18, lineHeight: 24 } satisfies TextStyle,
  title2: { fontFamily: F.medium, fontSize: 16, lineHeight: 22 } satisfies TextStyle,
  caption: { fontFamily: F.medium, fontSize: 12, lineHeight: 16 } satisfies TextStyle,
  description: { fontFamily: F.regular, fontSize: 14, lineHeight: 21 } satisfies TextStyle,
  body: { fontFamily: F.regular, fontSize: 15, lineHeight: 22 } satisfies TextStyle,
} as const;
