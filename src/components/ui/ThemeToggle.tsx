'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const;

  return (
    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
            theme === value
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          title={`${label} theme`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle; 