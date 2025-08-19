'use client';

import React, { useEffect } from 'react';


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
    <AppProvider>
      {children}
    </AppProvider>
  );
};

export default Providers;