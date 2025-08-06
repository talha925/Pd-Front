'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Image from 'next/image';
import parse from 'html-react-parser';
import Head from 'next/head';

// Define the decodeHtmlEntities function to decode HTML entities
function decodeHtmlEntities(str: string) {
  if (!str) return '';
  
  // Using a textarea to decode HTML entities
  const textArea = document.createElement('textarea');
  textArea.innerHTML = str;
  return textArea.value;
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
        // Safely extract blogs array from response
        let blogs = [];
        if (res && typeof res === 'object') {
          if (res.blogs && Array.isArray(res.blogs)) {
            blogs = res.blogs;
          } else if (res.blogs && res.blogs.blogs && Array.isArray(res.blogs.blogs)) {
            blogs = res.blogs.blogs;
          } else if (res.data && res.data.blogs && Array.isArray(res.data.blogs)) {
            blogs = res.data.blogs;
          }
        }
        
        const found = blogs.find((b: any) => b.slug === slug || b._id === slug);

        if (found) {
          // Step 2: Fetch full detail by _id
          api.get(`/api/blogs/${found._id}`)
            .then((detailRes) => {
              // Safely extract blog data from response
              let fullBlog = null;
              if (detailRes && typeof detailRes === 'object') {
                if (detailRes.blog) {
                  fullBlog = detailRes.blog;
                } else if (detailRes.data) {
                  fullBlog = detailRes.data;
                }
              }
              
              if (fullBlog) {
                setBlog(fullBlog);
                setError('');
              } else {
                setError('Blog data not found');
              }
            })
            .catch((err) => {
              console.error('Blog detail fetch error:', err);
              setError('Failed to fetch blog detail');
            })
            .finally(() => setLoading(false));
        } else {
          setError('Blog not found');
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Blog list fetch error:', err);
        setError('Failed to fetch blog');
        setLoading(false);
      });
  }, [slug]);

  // Don't render anything until the component has mounted to avoid hydration errors
  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="w-16 h-16 border-t-4 border-blue-600 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-40">
        <span className="text-lg text-red-600">{error}</span>
      </div>
    );
  }

  if (!blog) {
    return <div className="flex justify-center items-center h-40"><span className="text-lg text-gray-600">No content available.</span></div>;
  }

  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://pd-front-psi.vercel.app' : 'http://localhost:3000';

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
              priority // Add this to mark the image as priority

          />
        )}

        <h1 className="text-3xl font-bold mb-4">{blog.title}</h1>

        {blog.longDescription ? (
          <div className="prose max-w-none">
            {/* Decoding HTML entities */}
            {parse(decodeHtmlEntities(blog.longDescription))}
          </div>
        ) : (
          <div className="text-gray-500 italic">No content available.</div>
        )}
      </div>
    </>
  );
}
