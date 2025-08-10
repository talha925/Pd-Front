'use client';

import React from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface TinyMCEWrapperProps {
  value: string;
  onEditorChange: (content: string, editor: any) => void;
  placeholder?: string;
}

const TinyMCEWrapper: React.FC<TinyMCEWrapperProps> = ({
  value,
  onEditorChange,
  placeholder = 'Start writing...'
}) => {
  return (
    <Editor
      apiKey='6be041uk7orm1ngovq1ze4udc28my9puzhlaeosuhcm6g3lg'
      value={value}
      onEditorChange={onEditorChange}
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
  );
};

export default TinyMCEWrapper;