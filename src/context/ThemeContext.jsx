import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

 
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('bls_theme') || 'neobrutalism';
  });

  useEffect(() => {
    // Inject the selected theme to body class
    document.body.className = '';
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('bls_theme', theme);
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
