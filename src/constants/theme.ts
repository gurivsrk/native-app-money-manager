export const theme = {
  colors: {
    // Backgrounds & Surfaces
    background: '#0A0E17',
    backgroundSecondary: '#0F1523',
    surface: '#131B2B',
    surfaceCard: '#172237',
    surfaceElevated: '#1D2A44',
    surfaceHighlight: '#243452',

    // Borders & Dividers
    border: '#1F2E45',
    borderLight: '#2A3C59',
    borderFocus: '#3B82F6',

    // Core Brand Accents
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',
    primaryGlow: 'rgba(59, 130, 246, 0.25)',

    success: '#10B981',
    successLight: '#34D399',
    successDark: '#059669',
    successGlow: 'rgba(16, 185, 129, 0.2)',

    danger: '#F43F5E',
    dangerLight: '#FB7185',
    dangerDark: '#E11D48',
    dangerGlow: 'rgba(244, 63, 94, 0.2)',

    warning: '#F59E0B',
    warningLight: '#FBBF24',
    warningGlow: 'rgba(245, 158, 11, 0.2)',

    purple: '#8B5CF6',
    purpleLight: '#A78BFA',
    purpleGlow: 'rgba(139, 92, 246, 0.2)',

    cyan: '#06B6D4',
    cyanLight: '#22D3EE',
    cyanGlow: 'rgba(6, 182, 212, 0.2)',

    // Text & Content
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textMuted: '#475569',
    textInverse: '#0A0E17',

    // Overlays
    backdrop: 'rgba(5, 8, 15, 0.78)',
    overlayCard: 'rgba(255, 255, 255, 0.04)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
  },

  radii: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
  },

  shadows: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    glowPrimary: {
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 12,
      elevation: 8,
    },
    glowSuccess: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 6,
    },
    glowDanger: {
      shadowColor: '#F43F5E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 6,
    },
  },
};
