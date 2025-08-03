'use client';

import React from 'react';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { AppProvider } from './AppContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppProvider>
          {children}
        </AppProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default Providers; 