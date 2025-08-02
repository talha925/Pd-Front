'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BlogPost {
  _id: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  author?: string;
  category?: {
    _id: string;
    name: string;
  };
  status?: 'draft' | 'published';
  isFeatured?: boolean;
  image?: {
    url: string;
    alt: string;
  };
  createdAt: string;
  updatedAt: string;
}

const BlogPage = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/blogs');
      if (response.ok) {
        const data = await response.json();
        setBlogPosts(data.blogs || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch blog posts');
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      setError('Failed to fetch blog posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading blog posts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-md mx-auto">
              <p className="font-medium">Error Loading Blog Posts</p>
              <p className="text-sm mt-1">{error}</p>
              <button 
                onClick={fetchBlogPosts}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Blog Posts</h1>
          <p className="text-gray-600 mb-8">View and manage all your blog posts</p>
          <Link 
            href="/blog/create"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Blog Post
          </Link>
        </div>

        {/* Blog Posts Grid */}
        {blogPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Blog Posts Yet</h3>
              <p className="text-gray-600 mb-6">Start creating amazing content with our blog form!</p>
              <Link 
                href="/blog/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Post
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <div key={post._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 relative">
                {/* Featured Badge */}
                {post.isFeatured && (
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 absolute top-2 right-2 rounded-full z-10">
                    Featured
                  </div>
                )}

                {/* Image */}
                {post.image?.url && (
                  <div className="relative h-48 bg-gray-200">
                    <Image
                      src={post.image.url}
                      alt={post.image.alt || post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  {/* Status and Date */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      post.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {post.status || 'draft'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  
                  {/* Short Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {post.shortDescription}
                  </p>

                  {/* Meta Information */}
                  <div className="space-y-2 mb-4">
                    {post.author && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Author:</span> {post.author}
                      </div>
                    )}
                    {post.category && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Category:</span> {post.category.name}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {post.longDescription.length} characters
                    </span>
                    <Link 
                      href={`/blog/${post._id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage; 