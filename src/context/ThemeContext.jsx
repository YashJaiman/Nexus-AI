import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { updateProfile } from '../api/auth';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user, token, updateUser } = useAuth();
  const [theme, setThemeState] = useState(() => localStorage.getItem('nexus_theme') || 'dark');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light-theme', theme === 'light');
    root.dataset.theme = theme;
    localStorage.setItem('nexus_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user?.preferences?.theme && user.preferences.theme !== theme) {
      setThemeState(user.preferences.theme);
    }
  }, [user?.preferences?.theme]);

  const setTheme = (nextTheme) => {
    setThemeState(nextTheme === 'light' ? 'light' : 'dark');
  };

  const syncThemePreference = async (nextTheme) => {
    if (!user || !token) return;

    try {
      const updatedPrefs = {
        preferences: {
          ...user.preferences,
          theme: nextTheme
        }
      };
      const res = await updateProfile(updatedPrefs, token);
      if (res?.success && res.user) {
        updateUser(res.user);
      }
    } catch (err) {
      console.error('[Theme Sync] Theme preference synchronization failed:', err);
    }
  };

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    await syncThemePreference(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
