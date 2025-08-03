'use client';

import React from 'react';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { AppProvider } from './AppContext';

interface ProvidersProps {
  children: React.ReactNode;
  initialToken?: string | null;
}

export const Providers: React.FC<ProvidersProps> = ({ children, initialToken }) => {
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