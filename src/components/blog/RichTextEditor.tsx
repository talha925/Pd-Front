'use client';

import React from 'react';
import { Editor } from '@tinymce/tinymce-react';

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
      <Editor
        apiKey='6be041uk7orm1ngovq1ze4udc28my9puzhlaeosuhcm6g3lg'
        value={value}
        onEditorChange={handleEditorChange}
        init={{
          height: 400,
          menubar: true,
          plugins: [
            'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'image', 'link', 'lists', 
            'media', 'searchreplace', 'table', 'visualblocks', 'wordcount', 'code', 'fullscreen',
            'insertdatetime', 'preview', 'help',
            'checklist', 'mediaembed', 'casechange', 'formatpainter', 'pageembed'
          ],
          toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | ' +
            'link image media table | align lineheight | checklist numlist bullist indent outdent | ' +
            'emoticons charmap | removeformat | code fullscreen help',
          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 16px; }',
          placeholder: placeholder,
          images_upload_handler: function (blobInfo, progress) {
            return new Promise((resolve, reject) => {
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