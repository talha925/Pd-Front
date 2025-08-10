'use client';

import React, { Suspense, lazy } from 'react';

// Dynamically import TinyMCE Editor to reduce initial bundle size
const LazyTinyMCEEditor = lazy(() => import('./TinyMCEWrapper'));

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  error?: string;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  error,
  placeholder = 'Start writing your blog content...'
}) => {
  const handleEditorChange = (content: string, editor: any) => {
    onChange(content);
    
    // Save to localStorage for draft functionality
    try {
      localStorage.setItem('blogDraft', content);
    } catch (error) {
      console.error('Error saving draft to localStorage:', error);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Long Description <span className="text-red-500">*</span>
      </label>
      <Suspense fallback={
        <div className="border border-gray-300 rounded-md p-4 h-96 flex items-center justify-center bg-gray-50">
          <div className="text-gray-500">Loading editor...</div>
        </div>
      }>
        <LazyTinyMCEEditor
          value={value}
          onEditorChange={handleEditorChange}
          placeholder={placeholder}
        />
      </Suspense>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default RichTextEditor;