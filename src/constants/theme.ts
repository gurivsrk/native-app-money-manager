export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeColors {
  // Backgrounds & Surfaces (Apple System Grouped)
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceCard: string;
  surfaceElevated: string;
  surfaceHighlight: string;

  // Borders & Dividers
  border: string;
  borderLight: string;
  borderFocus: string;

  // Apple System Brand Accents
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGlow: string;

  success: string;
  successLight: string;
  successDark: string;
  successGlow: string;

  danger: string;
  dangerLight: string;
  dangerDark: string;
  dangerGlow: string;

  warning: string;
  warningLight: string;
  warningGlow: string;

  purple: string;
  purpleLight: string;
  purpleGlow: string;

  cyan: string;
  cyanLight: string;
  cyanGlow: string;

  // Text & Typography
  text: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  textInverse: string;

  // Overlays & Sheet
  backdrop: string;
  overlayCard: string;
  glassBorder: string;
}

export interface ThemeRadii {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface ThemeShadows {
  card: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  glowPrimary: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  glowSuccess: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  glowDanger: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

export interface Theme {
  isDark: boolean;
  colors: ThemeColors;
  radii: ThemeRadii;
  shadows: ThemeShadows;
}

// Apple iOS Clean Light Palette (System Grouped Background & Inset Surfaces)
export const lightColors: ThemeColors = {
  background: '#F2F2F7',           // Apple System Grouped Background
  backgroundSecondary: '#E5E5EA',  // Apple Secondary System Fill
  surface: '#FFFFFF',              // Pure Apple Card Surface
  surfaceCard: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceHighlight: '#F8F9FA',

  border: '#E5E5EA',               // Apple System Separator
  borderLight: '#F2F2F7',
  borderFocus: '#007AFF',

  // Apple System Accents
  primary: '#007AFF',              // Apple System Blue
  primaryLight: '#5AC8FA',
  primaryDark: '#0051A8',
  primaryGlow: 'rgba(0, 122, 255, 0.12)',

  success: '#34C759',              // Apple System Green
  successLight: '#30D158',
  successDark: '#248A3D',
  successGlow: 'rgba(52, 199, 89, 0.14)',

  danger: '#FF3B30',               // Apple System Red
  dangerLight: '#FF453A',
  dangerDark: '#D70015',
  dangerGlow: 'rgba(255, 59, 48, 0.14)',

  warning: '#FF9500',              // Apple System Orange
  warningLight: '#FF9F0A',
  warningGlow: 'rgba(255, 149, 0, 0.14)',

  purple: '#AF52DE',               // Apple System Purple
  purpleLight: '#BF5AF2',
  purpleGlow: 'rgba(175, 82, 222, 0.14)',

  cyan: '#00C7BE',                 // Apple System Teal / Mint
  cyanLight: '#64D2FF',
  cyanGlow: 'rgba(0, 199, 190, 0.14)',

  text: '#1C1C1E',                 // Apple Primary Label
  textSecondary: '#6C6C70',        // Apple Secondary Label
  textTertiary: '#8E8E93',         // Apple Tertiary Label
  textMuted: '#AEAEB2',            // Apple Quaternary Label
  textInverse: '#FFFFFF',

  backdrop: 'rgba(0, 0, 0, 0.4)',
  overlayCard: 'rgba(0, 0, 0, 0.02)',
  glassBorder: 'rgba(0, 0, 0, 0.06)',
};

// Apple iOS Clean Dark Palette (OLED True Black & Secondary Grouped Inset Surfaces)
export const darkColors: ThemeColors = {
  background: '#000000',           // Apple True Black
  backgroundSecondary: '#121214',
  surface: '#1C1C1E',              // Apple Secondary System Grouped Surface
  surfaceCard: '#1C1C1E',
  surfaceElevated: '#2C2C2E',      // Apple Tertiary System Surface
  surfaceHighlight: '#3A3A3C',

  border: '#2C2C2E',               // Apple Dark Separator
  borderLight: '#38383A',
  borderFocus: '#0A84FF',

  // Apple System Dark Accents
  primary: '#0A84FF',              // Apple System Dark Blue
  primaryLight: '#64D2FF',
  primaryDark: '#0051A8',
  primaryGlow: 'rgba(10, 132, 255, 0.22)',

  success: '#30D158',              // Apple System Dark Green
  successLight: '#34D399',
  successDark: '#248A3D',
  successGlow: 'rgba(48, 209, 88, 0.22)',

  danger: '#FF453A',               // Apple System Dark Red
  dangerLight: '#FF6961',
  dangerDark: '#D70015',
  dangerGlow: 'rgba(255, 69, 58, 0.22)',

  warning: '#FF9F0A',              // Apple System Dark Orange
  warningLight: '#FFD60A',
  warningGlow: 'rgba(255, 159, 10, 0.22)',

  purple: '#BF5AF2',               // Apple System Dark Purple
  purpleLight: '#DA8FFF',
  purpleGlow: 'rgba(191, 90, 242, 0.22)',

  cyan: '#64D2FF',                 // Apple System Dark Teal
  cyanLight: '#70D7FF',
  cyanGlow: 'rgba(100, 210, 255, 0.22)',

  text: '#FFFFFF',                 // Apple Dark Primary Label
  textSecondary: '#8E8E93',        // Apple Dark Secondary Label
  textTertiary: '#636366',         // Apple Dark Tertiary Label
  textMuted: '#48484A',
  textInverse: '#000000',

  backdrop: 'rgba(0, 0, 0, 0.75)',
  overlayCard: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
};

export const radii: ThemeRadii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const getShadows = (isDark: boolean): ThemeShadows => ({
  card: isDark
    ? {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
      }
    : {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      },
  glowPrimary: {
    shadowColor: isDark ? '#0A84FF' : '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.35 : 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  glowSuccess: {
    shadowColor: isDark ? '#30D158' : '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.35 : 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  glowDanger: {
    shadowColor: isDark ? '#FF453A' : '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.35 : 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
});

export const getTheme = (isDark: boolean): Theme => ({
  isDark,
  colors: isDark ? darkColors : lightColors,
  radii,
  shadows: getShadows(isDark),
});

// Default fallback theme
export const theme = getTheme(false);
