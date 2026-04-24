import React, { createContext, useContext, useState } from 'react';

export const PALETTE = {
  primary: '#111111',
  secondary: '#FFFFFF',
  dark: '#111111',
  light: '#FFFFFF',
  text: '#111111',
  textMuted: '#666666',
  muted: '#F5F5F5',
  border: '#E8E8E8',
  borderDark: '#CCCCCC',
  accent: '#5BBFDA',
  accentLight: '#A8DFF0',
  accentLighter: '#DDF2FA',
  accentDark: '#2E9DBB',
  accentTextSoft: '#1A6F88',
  card: '#FFFFFF',
  cardAlt: '#F7F7F7',
  overlay: 'rgba(0,0,0,0.32)',
  overlayLight: 'rgba(0,0,0,0.15)',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
};

export const lightTheme = {
  primary: PALETTE.primary,
  secondary: PALETTE.secondary,
  bg: PALETTE.light,
  bgSecondary: PALETTE.muted,
  bgCard: PALETTE.card,
  bgCardAlt: PALETTE.cardAlt,
  bgInput: PALETTE.muted,
  text: PALETTE.text,
  textSecondary: PALETTE.primary,
  textMuted: PALETTE.textMuted,
  // Text placed directly on the main page background.
  bgText: PALETTE.text,
  bgTextMuted: PALETTE.textMuted,
  border: PALETTE.border,
  borderLight: PALETTE.border,
  borderDark: PALETTE.borderDark,
  accent: PALETTE.accent,
  accentLight: PALETTE.accentLight,
  accentLighter: PALETTE.accentLighter,
  accentDark: PALETTE.accentDark,
  // Text used on main accent buttons.
  accentText: PALETTE.secondary,
  // Text used when the accent color is lighter.
  accentTextSoft: PALETTE.accentTextSoft,
  cardShadow: 'rgba(0,0,0,0.08)',
  tabBar: PALETTE.card,
  tabBarBorder: PALETTE.border,
  statusBar: 'dark',
  badge: PALETTE.primary,
  badgeText: PALETTE.secondary,
  ashCloud: PALETTE.borderDark,
  success: PALETTE.success,
  successSoft: 'rgba(22,163,74,0.12)',
  warning: PALETTE.warning,
  warningSoft: 'rgba(217,119,6,0.12)',
  danger: PALETTE.danger,
  dangerSoft: 'rgba(220,38,38,0.12)',
  info: PALETTE.accentDark,
  infoSoft: 'rgba(91,191,218,0.14)',
};

export const darkTheme = {
  primary: PALETTE.primary,
  secondary: PALETTE.secondary,
  // Dark mode keeps the page dark and cards light.
  bg: PALETTE.dark,
  bgSecondary: PALETTE.dark,
  bgCard: PALETTE.card,
  bgCardAlt: PALETTE.cardAlt,
  bgInput: PALETTE.muted,
  // Text inside cards and inputs.
  text: PALETTE.text,
  textSecondary: PALETTE.text,
  textMuted: PALETTE.textMuted,
  // Text shown on the dark page background.
  bgText: PALETTE.secondary,
  bgTextMuted: PALETTE.borderDark,
  border: PALETTE.borderDark,
  borderLight: PALETTE.border,
  borderDark: PALETTE.borderDark,
  accent: PALETTE.accent,
  accentLight: PALETTE.accentLight,
  accentLighter: PALETTE.accentLighter,
  accentDark: PALETTE.accentDark,
  accentText: PALETTE.primary,
  accentTextSoft: PALETTE.accentTextSoft,
  cardShadow: PALETTE.overlayLight,
  tabBar: PALETTE.dark,
  tabBarBorder: PALETTE.borderDark,
  statusBar: 'light',
  badge: PALETTE.secondary,
  badgeText: PALETTE.primary,
  ashCloud: PALETTE.borderDark,
  success: PALETTE.success,
  successSoft: PALETTE.accentLighter,
  warning: PALETTE.warning,
  warningSoft: PALETTE.accentLighter,
  danger: PALETTE.danger,
  dangerSoft: PALETTE.accentLighter,
  info: PALETTE.accent,
  infoSoft: PALETTE.accentLighter,
};

const roleToneMap = {
  FMG: { bg: PALETTE.primary, text: PALETTE.secondary, subtle: PALETTE.overlayLight },
  PL: { bg: PALETTE.accentDark, text: PALETTE.secondary, subtle: PALETTE.accent },
  PRL: { bg: PALETTE.accent, text: PALETTE.primary, subtle: PALETTE.accentLight },
  Lecturer: { bg: PALETTE.accentLight, text: PALETTE.primary, subtle: PALETTE.accentLighter },
  Student: { bg: PALETTE.accentLighter, text: PALETTE.primary, subtle: PALETTE.muted },
};

export const getRoleTone = (role) =>
  roleToneMap[role] || { bg: PALETTE.accent, text: PALETTE.primary, subtle: PALETTE.accentLight };

export const getRoleLabel = (role) => {
  switch (role) {
    case 'FMG':
      return 'Faculty Manager';
    case 'PL':
      return 'Program Leader';
    case 'PRL':
      return 'Program Representative Leader';
    case 'YL':
      return 'Year Leader';
    default:
      return role || '';
  }
};

export const getStatusLabel = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'submitted':
      return 'Submitted';
    case 'reviewed':
      return 'Reviewed';
    default:
      return status || '';
  }
};

export const getStatusTone = (theme, status) => {
  switch ((status || '').toLowerCase()) {
    case 'reviewed':
      return { bg: theme.infoSoft, text: theme.info, border: theme.info, fill: theme.info };
    case 'submitted':
      return { bg: theme.warningSoft, text: theme.warning, border: theme.warning, fill: theme.warning };
    default:
      return { bg: theme.bgSecondary, text: theme.text, border: theme.border, fill: theme.accent };
  }
};

export const getProgressTone = (theme, value, threshold = 75) =>
  value >= threshold
    ? { bg: theme.successSoft, text: theme.success, fill: theme.success, border: theme.success }
    : { bg: theme.dangerSoft, text: theme.danger, fill: theme.danger, border: theme.danger };

export const getRatingTone = (theme) => ({
  bg: theme.warningSoft,
  text: theme.warning,
  fill: theme.warning,
  border: theme.warning,
});

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? darkTheme : lightTheme;
  const toggleTheme = () => setIsDark(d => !d);
  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
