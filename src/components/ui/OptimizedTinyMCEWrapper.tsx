'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface OptimizedTinyMCEWrapperProps {
  id?: string;
  value: string;
  onChange: (content: string, editor: any) => void;
  height?: number;
  placeholder?: string;
  mode?: 'basic' | 'advanced';
  disabled?: boolean;
  onInit?: (evt: any, editor: any) => void;
}

// Memoized configuration to prevent recreation on every render
const createEditorConfig = (
  height: number,
  placeholder: string,
  mode: 'basic' | 'advanced'
) => {
  const baseConfig = {
    height,
    placeholder,
    menubar: mode === 'advanced',
    branding: false,
    promotion: false,
    content_style: `
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; max-width: 960px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; }
      h1, h2, h3, h4 { color: #0f172a; font-weight: 800; line-height: 1.25; margin-top: 2rem; margin-bottom: 0.75rem; }
      h1 { font-size: 2rem; }
      h2 { font-size: 1.6rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem; }
      h3 { font-size: 1.25rem; }
      p { margin: 1rem 0; line-height: 1.7; color: #334155; }
      a { color: #2563eb; text-decoration: underline; }
      img { max-width: 100%; height: auto; border-radius: 0.75rem; }
      
      /* Blog MGX Components Styling for Editor & Preview */
      .mgx-subtitle { font-size: 1.15rem; line-height: 1.7; color: #1e293b; font-weight: 500; padding: 1.25rem 1.5rem; background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%); border-left: 4px solid #3b82f6; border-radius: 0 0.875rem 0.875rem 0; margin: 1.5rem 0; }
      .mgx-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 2rem 0; }
      .mgx-stat { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 1.25rem; padding: 1.5rem 0.85rem; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.03); display: flex; flex-direction: column; align-items: center; justify-content: flex-start; font-size: 0.875rem; color: #64748b; font-weight: 500; }
      .mgx-stat strong { display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 900; white-space: nowrap; margin-bottom: 0.5rem; color: #2563eb; }
      .mgx-stat:nth-child(3) strong { font-size: 1.15rem; }
      .mgx-answer { background: linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%); border: 1px solid #bbf7d0; border-left: 5px solid #10b981; border-radius: 1.25rem; padding: 1.75rem 2rem; margin: 2.25rem 0; }
      .mgx-answer h3 { color: #065f46; font-size: 1.25rem; font-weight: 800; margin-top: 0; margin-bottom: 0.75rem; }
      .mgx-answer p { color: #1e293b; margin: 0; }
      .mgx-feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.85rem; margin: 2.25rem 0; }
      .mgx-feature { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 1.15rem; padding: 1.4rem 0.85rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03); font-size: 0.85rem; color: #64748b; line-height: 1.55; display: flex; flex-direction: column; }
      .mgx-feature strong { display: block; font-size: 0.88rem; font-weight: 800; color: #0f172a; margin-bottom: 0.65rem; white-space: nowrap; }
      .mgx-feature:nth-child(3) strong { font-size: 0.8rem; }
      .mgx-section-intro { display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem; align-items: center; margin: 2.25rem 0; }
      .mgx-section-image { border-radius: 1.25rem; overflow: hidden; background: #ebebeb; border: 1px solid #e2e8f0; height: 260px; display: flex; align-items: center; justify-content: center; position: relative; }
      .mgx-section-image img { width: 100%; height: 100%; object-fit: contain; }
      .mgx-carousel { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.75rem; margin: 2.5rem 0; }
      .mgx-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 1.25rem; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
      .mgx-card-image { background: #ebebeb; display: flex; align-items: center; justify-content: center; height: 230px; border-bottom: 1px solid #e2e8f0; overflow: hidden; position: relative; }
      .mgx-card-image img { width: 100%; height: 100%; object-fit: contain; }
      .mgx-card-content { padding: 1.25rem; display: flex; flex-direction: column; flex: 1; }
      .mgx-badge { display: inline-flex; align-self: flex-start; padding: 0.3rem 0.75rem; background: #eff6ff; color: #1d4ed8; font-size: 0.7rem; font-weight: 750; text-transform: uppercase; border-radius: 9999px; margin-bottom: 0.75rem; border: 1px solid #dbeafe; }
      .mgx-card-content h3 { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0 0 0.4rem 0; }
      .mgx-rating { font-size: 0.8rem; font-weight: 650; color: #059669; margin: 0 0 0.6rem 0; }
      .mgx-desc { font-size: 0.875rem; color: #475569; line-height: 1.55; margin: 0 0 1.25rem 0; }
      .mgx-btn { display: inline-block; width: 100%; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; font-weight: 700; font-size: 0.875rem; padding: 0.75rem 1rem; border-radius: 0.85rem; text-decoration: none !important; margin-top: auto; }
      .mgx-results { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 1.5rem; padding: 2.25rem 1rem; margin: 3rem 0; }
      .mgx-results-head { text-align: center; margin-bottom: 2rem; }
      .mgx-results-title { font-size: 1.75rem; font-weight: 850; color: #0f172a; margin: 0 0 0.5rem 0; }
      .mgx-results-track { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.85rem; }
      .mgx-results-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 1.25rem; overflow: hidden; padding: 0.85rem; box-shadow: 0 2px 10px rgba(0,0,0,0.04); display: flex; flex-direction: column; }
      .mgx-comparison-frame { position: relative; border-radius: 0.875rem; overflow: hidden; height: 260px; background: #0f172a; width: 100%; }
      .mgx-after img, .mgx-before img { width: 100%; height: 100%; object-fit: cover; }
      .mgx-warning { position: absolute; bottom: 0; left: 0; right: 0; width: 100%; background: #dc2626; color: #ffffff; font-size: 11px; font-weight: 800; padding: 6px 8px; text-transform: uppercase; text-align: center; }
      .mgx-reveal { position: absolute; inset: 0; backdrop-filter: blur(20px); background: rgba(15, 23, 42, 0.65); display: flex; flex-direction: column; align-items: center; justify-content: center; padding-bottom: 24px; }
      .mgx-reveal button { background: #2563eb; color: #ffffff; font-size: 0.85rem; font-weight: 750; padding: 0.75rem 1.4rem; border-radius: 0.6rem; border: none; }
      .mgx-results-card .mgx-stats { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0.85rem 0 0.5rem 0; min-height: 110px; }
      .mgx-stat-value { font-size: 1.85rem; font-weight: 950; color: #059669; }
      .mgx-stat-type { font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
      .mgx-stat-extra { font-size: 0.85rem; font-weight: 650; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 0.25rem 0.75rem; border-radius: 9999px; margin-top: 0.35rem; }
      .mgx-card-footer { text-align: center; font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; padding-top: 0.75rem; border-top: 1px solid #f1f5f9; margin-top: auto; }
      .mgx-table-wrap { overflow-x: auto; margin: 2.5rem 0; border-radius: 1rem; border: 1px solid #cbd5e1; background: #ffffff; }
      .mgx-table-wrap table { width: 100%; border-collapse: collapse; text-align: left; }
      .mgx-table-wrap th { background: #f1f5f9; padding: 1rem 1.25rem; font-weight: 800; color: #0f172a; border-bottom: 2px solid #cbd5e1; border-right: 1px solid #cbd5e1; font-size: 0.78rem; text-transform: uppercase; }
      .mgx-table-wrap th:last-child { border-right: none; }
      .mgx-table-wrap td { padding: 1rem 1.25rem; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; color: #334155; }
      .mgx-table-wrap td:last-child { border-right: none; }
      .mgx-table-wrap tbody tr:nth-child(even) { background: #f8fafc; }
      .mgx-table-wrap tbody tr:hover { background: #f1f5f9; }
      .mgx-trust { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 2.25rem 0; }
      .mgx-trust-item { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.875rem; padding: 1.15rem; text-align: center; font-size: 0.85rem; color: #166534; }
      .mgx-trust-item strong { display: block; font-size: 1rem; font-weight: 800; color: #14532d; margin-bottom: 0.35rem; }
      .mgx-faq details { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.875rem; margin-bottom: 0.85rem; }
      .mgx-faq summary { padding: 1.15rem 1.35rem; font-weight: 700; color: #0f172a; cursor: pointer; }
      .mgx-faq details p { padding: 0.75rem 1.35rem 1.35rem 1.35rem; margin: 0; color: #475569; border-top: 1px solid #f1f5f9; }
      .mgx-fall { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%); border-radius: 1.5rem; padding: 2.75rem 2rem; margin: 3rem 0; text-align: center; color: #ffffff; }
      .mgx-fall h2 { color: #ffffff; margin-top: 0; }
      .mgx-fall p { color: #cbd5e1; }
      .mgx-fall .mgx-btn { display: inline-block; width: auto; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 0.9rem 2.5rem; border-radius: 0.95rem; }
      .mgx-cta { background: linear-gradient(135deg, #1d4ed8 0%, #312e81 100%); border-radius: 1.5rem; padding: 2.75rem 2rem; margin: 3rem 0; text-align: center; color: #ffffff; }
      .mgx-cta h2 { color: #ffffff; margin-top: 0; }
      .mgx-cta p { color: #dbeafe; }
      .mgx-cta .mgx-btn { display: inline-block; width: auto; background: #ffffff; color: #1d4ed8 !important; padding: 0.85rem 2.25rem; border-radius: 0.85rem; }
    `,
    skin: 'oxide',
    content_css: 'default',
    
    // Performance optimizations
    convert_urls: false,
    relative_urls: false,
    remove_script_host: false,
    
    // Accessibility improvements
    a11y_advanced_options: true,
    
    // Image upload handler with retry mechanism and better error handling
    images_upload_handler: function (blobInfo: any, progress: (percent: number) => void): Promise<string> {
      return new Promise<string>(async (resolve, reject) => {
        const maxRetries = 3;
        
        const attemptUpload = async (attempt: number): Promise<void> => {
          try {
            const reader = new FileReader();
            
            reader.onload = function () {
              try {
                const result = reader.result as string;
                // Validate the result before resolving
                if (result && result.startsWith('data:')) {
                  resolve(encodeURI(result));
                } else {
                  throw new Error('Invalid image data');
                }
              } catch (error) {
                throw new Error('Failed to process image');
              }
            };
            
            reader.onerror = function () {
              throw new Error('Image upload failed');
            };
            
            // Add progress tracking
            reader.onprogress = function (e) {
              if (e.lengthComputable) {
                progress((e.loaded / e.total) * 100);
              }
            };
            
            reader.readAsDataURL(blobInfo.blob());
          } catch (error) {
            if (attempt < maxRetries) {
              // Exponential backoff: wait longer between retries
              const delay = 1000 * Math.pow(2, attempt - 1);
              setTimeout(() => attemptUpload(attempt + 1), delay);
            } else {
              reject(`Image upload failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        };
        
        await attemptUpload(1);
      });
    }
  };

  // Mode-specific configurations
  if (mode === 'basic') {
    return {
      ...baseConfig,
      plugins: [
        'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
        'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'table', 'help', 'wordcount'
      ],
      toolbar: 'undo redo | formatselect | bold italic | ' +
        'alignleft aligncenter alignright alignjustify | ' +
        'bullist numlist outdent indent | link image | code preview'
    };
  }

  // Advanced mode with full features
  return {
    ...baseConfig,
    plugins: [
      // Core editing features
      'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'image', 'link', 'lists', 
      'media', 'searchreplace', 'table', 'visualblocks', 'wordcount', 'code', 'fullscreen',
      'insertdatetime', 'preview', 'help'
    ],
    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | ' +
      'link image media table | align lineheight | numlist bullist indent outdent | ' +
      'emoticons charmap | removeformat | code preview fullscreen help'
  };
};

/**
 * OptimizedTinyMCEWrapper - A performance-optimized TinyMCE wrapper
 * Features:
 * - Memoized configuration to prevent unnecessary re-renders
 * - Optimized image upload handling with progress tracking
 * - Basic and advanced modes for different use cases
 * - Better error handling and accessibility
 */
const OptimizedTinyMCEWrapper: React.FC<OptimizedTinyMCEWrapperProps> = memo(({
  id,
  value,
  onChange,
  height = 400,
  placeholder = 'Start typing...',
  mode = 'advanced',
  disabled = false,
  onInit
}) => {
  // Memoize the editor configuration to prevent recreation
  const editorConfig = useMemo(
    () => createEditorConfig(height, placeholder, mode),
    [height, placeholder, mode]
  );

  // Memoized change handler to prevent unnecessary re-renders
  const handleEditorChange = useCallback((content: string, editor: any) => {
    onChange(content, editor);
  }, [onChange]);

  // Memoized init handler
  const handleInit = useCallback((evt: any, editor: any) => {
    // Set up editor optimizations
    editor.on('init', () => {
      // Optimize editor performance
      editor.getBody().style.fontSize = '16px';
      editor.getBody().style.lineHeight = '1.6';
    });

    // Call custom onInit if provided
    if (onInit) {
      onInit(evt, editor);
    }
  }, [onInit]);

  return (
    <Editor
      apiKey="6be041uk7orm1ngovq1ze4udc28my9puzhlaeosuhcm6g3lg"
      id={id}
      value={value}
      disabled={disabled}
      onEditorChange={handleEditorChange}
      onInit={handleInit}
      init={editorConfig}
    />
  );
});

OptimizedTinyMCEWrapper.displayName = 'OptimizedTinyMCEWrapper';

export default OptimizedTinyMCEWrapper;