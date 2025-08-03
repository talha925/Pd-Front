'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Image from 'next/image';
import parse from 'html-react-parser';
import Head from 'next/head';

// Define the decodeHtmlEntities function to decode HTML entities
function decodeHtmlEntities(str: string) {
  if (!str) return '';

  const decodedOnce = str
    .replace(/&amp;/g, '&') // Decode `&amp;` to `&`
    .replace(/&lt;/g, '<')   // Decode `&lt;` to `<`
    .replace(/&gt;/g, '>')   // Decode `&gt;` to `>`
    .replace(/&quot;/g, '"') // Decode `&quot;` to `"`
    .replace(/&#x27;/g, "'") // Decode `&#x27;` to `'`
    .replace(/&#x2F;/g, '/') // Decode `&#x2F;` to `/`
    .replace(/&nbsp;/g, ' '); // Decode `&nbsp;` to space

  return decodedOnce
    .replace(/&lt;/g, '<')   
    .replace(/&gt;/g, '>')   
    .replace(/&amp;/g, '&')   
    .replace(/&quot;/g, '"')  
    .replace(/&#x27;/g, "'")  
    .replace(/&#x2F;/g, '/');
}

export default function BlogDetailPage() {
  const { id: slug } = useParams();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [mounted, setMounted] = useState(false); // Track whether the component has mounted

  useEffect(() => {
    setMounted(true); // Set mounted to true after component is mounted

    if (!slug) return;

    setLoading(true);
    setError('');

    // Fetch blog data directly using the slug
    api.get(`/api/blogs?slug=${slug}`)
      .then((res) => {
        const blogs = res.blogs?.blogs || res.data?.blogs || [];
        const found = blogs.find((b: any) => b.slug === slug || b._id === slug);

        if (found) {
          setBlog(found); // Set blog directly if found
        } else {
          setError('Blog not found');
        }
      })
      .catch(() => setError('Failed to fetch blog'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (!mounted) {
    return null; // Prevent rendering on the server side before the component has mounted
  }

  // If still loading, show a skeleton loader
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="w-16 h-16 border-t-4 border-blue-600 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  // If an error occurred during fetching
  if (error) {
    return (
      <div className="flex justify-center items-center h-40">
        <span className="text-lg text-red-600">{error}</span>
      </div>
    );
  }

  // If no blog is found or there's no content
  if (!blog) {
    return <div className="flex justify-center items-center h-40"><span className="text-lg text-gray-600">No blog content available.</span></div>;
  }

  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourwebsite.com' : 'http://localhost:3000';

  return (
    <>
      <Head>
        <title>{blog.meta?.title || blog.title}</title>
        <meta name="description" content={blog.meta?.description || blog.excerpt || 'Blog post description'} />
        <meta name="keywords" content={blog.meta?.keywords || 'blog, post, article'} />
        <meta property="og:title" content={blog.meta?.title || blog.title} />
        <meta property="og:description" content={blog.meta?.description || blog.excerpt || 'Blog post description'} />
        <meta property="og:image" content={blog.image?.url || '/default-image.jpg'} />
        <meta property="og:type" content="article" />
        <meta property="og:published_time" content={blog.createdAt || ''} />
        <meta property="og:author" content={blog.author || 'Unknown Author'} />
        <link rel="canonical" href={`${baseUrl}/blog/${slug}`} />
      </Head>

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
    </>
  );
}
