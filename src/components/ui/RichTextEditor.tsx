'use client';

import React, { Suspense, lazy } from 'react';

// Dynamically import TinyMCE Editor to reduce initial bundle size
const LazyTinyMCEEditor = lazy(() => import('./TinyMCEWrapper'));

interface RichTextEditorProps {
  id: string;
  value: string;
  onChange: (content: string, editor: any) => void;
  label?: string;
  error?: string;
  height?: number;
  placeholder?: string;
}

const RichTextEditor = ({
  id,
  value,
  onChange,
  label,
  error,
  height = 400,
  placeholder = 'Start typing...',
}: RichTextEditorProps) => {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <Suspense fallback={
        <div className="border border-gray-300 rounded-md p-4 flex items-center justify-center bg-gray-50" style={{ height }}>
          <div className="text-gray-500">Loading editor...</div>
        </div>
      }>
        <LazyTinyMCEEditor
          id={id}
          value={value}
          onChange={onChange}
          height={height}
          placeholder={placeholder}
        />
      </Suspense>
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default RichTextEditor;