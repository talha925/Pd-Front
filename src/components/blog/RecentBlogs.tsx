'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  image?: string | { url: string; alt?: string };
  createdAt: string;
  author: string | { name: string; _id: string };
}

interface RecentBlogsProps {
  currentBlogId?: string;
  limit?: number;
}

export default function RecentBlogs({ currentBlogId, limit = 5 }: RecentBlogsProps) {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentBlogs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/blogs?limit=${limit}${currentBlogId ? `&exclude=${currentBlogId}` : ''}`);
        if (!response.ok) {
          throw new Error('Failed to fetch blogs');
        }
        const data = await response.json();
        setBlogs(data.blogs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load blogs');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentBlogs();
  }, [currentBlogId, limit]);

  const getAuthorName = (author: string | { name: string; _id: string }): string => {
    if (typeof author === 'string') {
      return author;
    }
    return author?.name || 'Unknown Author';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <aside className="sticky top-24 h-fit">
        <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">📚</span>
            </div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Recent Blogs
            </h3>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="sticky top-24 h-fit">
        <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">📚</span>
            </div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Recent Blogs
            </h3>
          </div>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sticky top-24 h-fit">
      <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white text-sm font-bold">📚</span>
          </div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Recent Blogs
          </h3>
        </div>
        
        {blogs.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-2xl">📝</span>
            </div>
            <p className="text-gray-500 text-sm mb-6">No recent blogs available</p>
          </div>
        ) : (
          <div className="space-y-2">
              {blogs.slice(0, 3).map((blog) => {
              const imageUrl = typeof blog.image === 'string' ? blog.image : blog.image?.url;
              return (
                <Link
                  key={blog._id}
                  href={`/blog/${blog.slug}`}
                  className="block group hover:bg-white/50 rounded-xl p-2 transition-all duration-200 border border-transparent hover:border-white/30"
                >
                  <div className="flex gap-2">
                    {imageUrl && (
                      <div className="flex-shrink-0">
                        <SafeImage
                          src={imageUrl}
                          alt={blog.title}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                          fallbackSrc="/placeholder-blog.png"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 line-clamp-2 mb-0.5 transition-colors">
                        {blog.title}
                      </h4>
                      {blog.shortDescription && (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                          {blog.shortDescription}
                        </p>
                      )}

                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        
        <div className="pt-4 border-t border-gray-200/50">
          <Link
            href="/blog"
            className="block text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All Blogs →
          </Link>
        </div>
      </div>
    </aside>
  );
}