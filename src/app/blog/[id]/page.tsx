'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Image from 'next/image';
import parse from 'html-react-parser';

function decodeHtmlEntities(str: string) {
  if (!str) return '';
  return str.replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .replace(/&#x2F;/g, '/')
            .replace(/&nbsp;/g, ' ');
}

export default function BlogDetailPage() {
  const { id: slug } = useParams();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    // Step 1: Get blog by slug to find _id
    api.get(`/api/blogs?slug=${slug}`)
      .then((res) => {
        const blogs = res.blogs?.blogs || res.data?.blogs || [];
        const found = blogs.find((b: any) => b.slug === slug || b._id === slug);
        if (found && found._id) {
          // Step 2: Fetch full detail by _id
          api.get(`/api/blogs/${found._id}`)
            .then((detailRes) => {
              const fullBlog = detailRes.blog || detailRes.data;
              setBlog(fullBlog);
              setError('');
            })
            .catch(() => setError('Failed to fetch blog detail'))
            .finally(() => setLoading(false));
        } else {
          setError('Blog not found');
          setLoading(false);
        }
      })
      .catch(() => {
        setError('Failed to fetch blog');
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return <div className="flex justify-center items-center h-40"><span className="text-lg text-gray-600">Loading...</span></div>;
  }
  if (error) {
    return <div className="flex justify-center items-center h-40"><span className="text-lg text-red-600">{error}</span></div>;
  }
  if (!blog) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-8">
      {blog.image?.url && (
        <Image
          src={blog.image.url}
          alt={blog.image.alt || blog.title}
          width={800}
          height={400}
          className="rounded mb-6"
        />
      )}
      <h1 className="text-3xl font-bold mb-4">{blog.title}</h1>
      {blog.longDescription ? (
        <div className="prose max-w-none">
          {parse(decodeHtmlEntities(blog.longDescription))}
        </div>
      ) : (
        <div className="text-gray-500 italic">No content available.</div>
      )}
    </div>
  );
}
