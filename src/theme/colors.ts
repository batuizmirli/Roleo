export const colors = {
  // ─── Legacy palette — kept for backward compat with existing screens ───────
  // Old semantic colors from pre-design-system era (stitch-aligned palette).
  // Do not remove; referenced by HomeScreen, ScenarioScreen, etc.
  terracotta: '#B06D50',
  terracottaDark: '#884C32',
  terracottaSoft: '#A56448',
  cream: '#FCF9F8',
  creamSoft: '#F6F3F2',
  creamMuted: '#E7E2D9',

  background: '#F6F0E5',
  surface: '#FFFDF8',
  surfaceAlt: '#F1E9DD',
  surfaceMuted: '#ECE3D5',

  textPrimary: '#3B3126',
  textSecondary: '#6F6252',
  textMuted: '#9A8D7C',
  textOnAccent: '#FFFDF8',

  primaryCard: '#FFFDF8',
  primaryBorder: '#E3D8C9',
  primaryAccent: '#A66A4C',
  primaryAccentPressed: '#925B40',
  primaryAccentSoft: '#F3E2D7',

  secondaryCard: '#EEF1EA',
  secondaryBorder: '#D6DED0',
  secondaryAccent: '#7D9774',

  // old success: '#7D9774' — preserved below (DS version is #7FB28E)
  success: '#7D9774',
  warning: '#C3914B',
  danger: '#C86C60',

  overlay: '#00000022',
  divider: '#E7DDCF',
  dividerStrong: '#DDD1C0',

  amber50: '#F7EBDD',
  amber100: '#EDD1B4',
  amber500: '#C3914B',
  amber600: '#AB7B37',
  amber700: '#8E632B',

  white: '#FFFDF8',
  dark: '#2F241B',
  darkCard: '#EDE2D3',
  darkBg: '#E4D7C6',
  info: '#7D7AB8',
  infoSoft: '#EFEEFA',
  successSoft: '#EAF0E6',
  warningSoft: '#FBF2E4',
  dangerSoft: '#F8E7E4',

  // ─── Design System v2 — CLAUDE.md A3 ─────────────────────────────────────
  // Zemin — koyu, sinematik
  bgDeep: '#0A0E14',        // Ana arka plan, en koyu
  bgMid: '#121822',         // Kart arka planı, ikincil yüzey
  bgSoft: '#1A2230',        // Üçüncül yüzey, hover state'leri

  // Yazı — yüksek kontrast hiyerarşisi
  inkPrimary: '#E8EAED',    // Ana metin, başlıklar
  inkSecondary: '#9BA3AE',  // Alt metin, açıklamalar
  inkTertiary: '#5B6573',   // Etiket, meta bilgi, ipuçları

  // Akcent — sıcak mum ışığı
  accentWarm: '#E8B576',                      // Ana vurgu — CTA hover, önemli işaretler
  accentWarmSoft: '#C99A6A',                  // İkincil sıcak ton, daha bastırılmış
  accentGlow: 'rgba(232, 181, 118, 0.18)',    // Glow / aura efektleri

  // Çizgiler
  hairline: 'rgba(255, 255, 255, 0.06)',
  hairlineStrong: 'rgba(255, 255, 255, 0.12)',

  // Durum (DS versiyonları — mevcut 'success' ve 'danger' korundu)
  successDs: '#7FB28E',               // DS success — old value '#7D9774' kept as 'success'
  successDsSoft: 'rgba(127, 178, 142, 0.16)',  // DS success tint for dark backgrounds
  errorDs: '#C97A6A',                 // DS error — yumuşak, asla kırmızı değil
  errorDsSoft: 'rgba(201, 122, 106, 0.16)',    // DS error tint for dark backgrounds
} as const;
