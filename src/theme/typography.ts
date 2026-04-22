import { F, linguaType } from './fonts';

export const typography = {
  /** @deprecated prefer `linguaType` + `F` for new UI */
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
};
