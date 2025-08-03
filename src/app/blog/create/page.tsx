'use client';

import React from 'react';
import BlogForm from '@/components/blog/BlogForm';
import AuthGuard from '@/components/auth/AuthGuard';

const CreateBlogPage = () => {
  return (
    <AuthGuard 
      requiredPermissions={['write:blogs']}
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Create New Blog Post
              </h1>
              <p className="text-gray-600">
                Please log in to create blog posts.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Create New Blog Post
            </h1>
            <BlogForm />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default CreateBlogPage; 