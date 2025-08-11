'use client';

import React, { useEffect } from 'react';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { AppProvider } from './AppContext';

interface ProvidersProps {
  children: React.ReactNode;
  initialToken?: string | null;
}

export const Providers: React.FC<ProvidersProps> = ({ children, initialToken }) => {
  useEffect(() => {
    // Remove any data attributes potentially injected on SSR that could cause hydration mismatches
    const htmlEl = document.documentElement;
    if (htmlEl.hasAttribute('data-server-rendered')) {
      htmlEl.removeAttribute('data-server-rendered');
    }
  }, []);

  return (
    <AuthProvider initialToken={initialToken}>
      <ThemeProvider>
        <AppProvider>
          {children}
        </AppProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default Providers;