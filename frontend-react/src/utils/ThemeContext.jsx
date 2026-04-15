import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const darkTheme = {
  pageBg:         'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  sidebarBg:      'rgba(15,12,41,0.95)',
  headerBg:       'rgba(15,12,41,0.85)',
  glass:          { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(12px)' },
  cardBg:         'rgba(255,255,255,0.04)',
  inputBg:        'rgba(255,255,255,0.05)',
  modalBg:        'rgba(15,12,41,0.98)',
  border:         'rgba(99,102,241,0.2)',
  borderStrong:   'rgba(99,102,241,0.4)',
  divider:        'rgba(99,102,241,0.15)',
  textPrimary:    '#ffffff',
  textSecondary:  'rgba(165,180,252,0.8)',
  textMuted:      'rgba(165,180,252,0.5)',
  textFaint:      'rgba(165,180,252,0.4)',
  navActive:      'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))',
  navActiveBorder:'rgba(99,102,241,0.4)',
  navHover:       'rgba(99,102,241,0.1)',
  sectionLabel:   'rgba(99,102,241,0.6)',
  userPillBg:     'rgba(99,102,241,0.1)',
  userPillBorder: 'rgba(99,102,241,0.2)',
  tooltipBg:      'rgba(15,12,41,0.95)',
  tooltipBorder:  'rgba(99,102,241,0.4)',
  toggleBg:       'rgba(99,102,241,0.2)',
  toggleBorder:   'rgba(99,102,241,0.4)',
  toggleIcon:     '🌙',
  toggleColor:    '#a5b4fc',
};

const lightTheme = {
  pageBg:         'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #ede9fe 100%)',
  sidebarBg:      'rgba(255,255,255,0.97)',
  headerBg:       'rgba(255,255,255,0.90)',
  glass:          { background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(99,102,241,0.18)', backdropFilter: 'blur(12px)' },
  cardBg:         'rgba(255,255,255,0.75)',
  inputBg:        'rgba(255,255,255,0.9)',
  modalBg:        'rgba(255,255,255,0.99)',
  border:         'rgba(99,102,241,0.18)',
  borderStrong:   'rgba(99,102,241,0.35)',
  divider:        'rgba(99,102,241,0.12)',
  textPrimary:    '#1e1b4b',
  textSecondary:  '#4338ca',
  textMuted:      '#6366f1',
  textFaint:      'rgba(99,102,241,0.5)',
  navActive:      'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
  navActiveBorder:'rgba(99,102,241,0.35)',
  navHover:       'rgba(99,102,241,0.07)',
  sectionLabel:   'rgba(99,102,241,0.55)',
  userPillBg:     'rgba(99,102,241,0.08)',
  userPillBorder: 'rgba(99,102,241,0.18)',
  tooltipBg:      'rgba(255,255,255,0.98)',
  tooltipBorder:  'rgba(99,102,241,0.3)',
  toggleBg:       'rgba(251,191,36,0.15)',
  toggleBorder:   'rgba(251,191,36,0.4)',
  toggleIcon:     '☀️',
  toggleColor:    '#d97706',
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('scholarsense-theme');
    return saved ? saved === 'dark' : true;
  });

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('scholarsense-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
