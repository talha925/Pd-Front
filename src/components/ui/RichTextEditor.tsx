'use client';

import React from 'react';
import { Editor } from '@tinymce/tinymce-react';

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
      
      <Editor
        apiKey='6be041uk7orm1ngovq1ze4udc28my9puzhlaeosuhcm6g3lg'
        id={id}
        value={value}
        onEditorChange={onChange}
        init={{
          height,
          menubar: true,
          placeholder,
          plugins: [
            // Core editing features
            'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'image', 'link', 'lists', 
            'media', 'searchreplace', 'table', 'visualblocks', 'wordcount', 'code', 'fullscreen',
            'insertdatetime', 'preview', 'help',
            // Premium features available for free trial
            'checklist', 'mediaembed', 'casechange', 'formatpainter', 'pageembed'
          ],
          toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | ' +
            'link image media table | align lineheight | checklist numlist bullist indent outdent | ' +
            'emoticons charmap | removeformat | code fullscreen help',
          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 16px; }',
          images_upload_handler: function (blobInfo, progress) {
            return new Promise((resolve, reject) => {
              // Here you would typically upload the image to your server
              // For now, we'll just convert it to a data URL
              const reader = new FileReader();
              reader.onload = function () {
                resolve(reader.result as string);
              };
              reader.onerror = function () {
                reject('Image upload failed');
              };
              reader.readAsDataURL(blobInfo.blob());
            });
          }
        }}
      />
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default RichTextEditor; 