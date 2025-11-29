// app/blog/[id]/page.tsx

import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import parse, { DOMNode, Element, domToReact } from 'html-react-parser';
import config from '@/lib/config';
import { decode } from 'html-entities';
import TableOfContents from '@/components/blog/TableOfContents';
import RecentBlogs from '@/components/blog/RecentBlogs';

// Blog Type Interface
interface Blog {
  _id: string;
  title: string;
  slug?: string;
  longDescription?: string;
  image?: { url: string; alt?: string; };
  meta?: { title?: string; description?: string; keywords?: string; };
  excerpt?: string;
  createdAt?: string;
  author?: {
    name: string;
    email?: string;
    avatar?: string;
  } | string;
}

// NEW HELPER: This function will decode the string repeatedly until it's clean.
// This will fix your "&lt;p&gt;&amp;lt;p&amp;gt;..." issue.
function decodeRecursively(text: string): string {
  let newText = decode(text);
  while (newText !== text) {
    text = newText;
    newText = decode(text);
  }
  return newText;
}

// Extract headings for table of contents
function extractHeadings(html: string) {
  const headings: { id: string; text: string; level: number }[] = [];
  const decodedHtml = decodeRecursively(html);

  parse(decodedHtml, {
    replace: (domNode) => {
      const node = domNode as Element;
      if (node.name && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.name)) {
        const level = parseInt(node.name.charAt(1));
        const text = node.children
          .map((child: any) => child.type === 'text' ? child.data : '')
          .join('')
          .trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        headings.push({ id, text, level });
      }
    },
  });

  return headings;
}

// REBUILT & ROBUST: This function now correctly finds the right blog.
// WHY: Your API's slug filter isn't working, so we fetch the whole list and find the blog ourselves.
// This is the most reliable way and mimics your old working client-side logic.
async function fetchBlogBySlugOrId(slugOrId: string): Promise<Blog | null> {
  try {
    console.log(`Searching for blog with slug: ${slugOrId}`);

    // Step 1: Fetch ALL blogs from the general endpoint.
    // FIX: Added limit=1000 to ensure we get all blogs, not just the first page.
    // This fixes the "Blog Not Found" issue for blogs on page 2+.
    const listRes = await fetch(`${config.api.baseUrl}/api/blogs?limit=1000`, {
      next: { revalidate: 60 } // Cache for 1 minute
    });

    if (!listRes.ok) {
      throw new Error('Failed to fetch blog list');
    }

    const listData = await listRes.json();
    const allBlogs = listData.blogs || (listData.data && listData.data.blogs) || [];

    // Step 2: Find the correct blog in the list using its slug.
    const foundBlogSummary = allBlogs.find((b: any) => b.slug === slugOrId);

    if (!foundBlogSummary || !foundBlogSummary._id) {
      console.error(`Blog with slug "${slugOrId}" not found in the list.`);
      return null; // Blog not found
    }

    console.log(`Found blog ID: ${foundBlogSummary._id}. Now fetching full details...`);

    // Step 3: Use the found _id to get the complete blog data.
    const detailRes = await fetch(`${config.api.baseUrl}/api/blogs/${foundBlogSummary._id}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!detailRes.ok) {
      throw new Error(`Failed to fetch details for blog ID: ${foundBlogSummary._id}`);
    }

    const detailData = await detailRes.json();
    const fullBlog = detailData.blog || detailData.data?.blog || detailData.data;

    console.log('Successfully fetched full blog data:', fullBlog);
    console.log('longDescription present:', !!fullBlog?.longDescription);
    return fullBlog || null;

  } catch (error) {
    console.error('Error in fetchBlogBySlugOrId:', error);
    return null;
  }
}

// The parser now uses the new recursive decoder
function customParser(html: string) {
  // First, fully clean the double (or triple) encoded HTML string
  const decodedHtml = decodeRecursively(html);

  return parse(decodedHtml, {
    replace: (domNode) => {
      const node = domNode as Element;
      // Fix for invalid nesting like <p><ul>...</ul></p>
      if (node.name === 'p') {
        const containsBlockElement = node.children.some(
          (child) =>
            child.type === 'tag' &&
            ['ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'div', 'blockquote'].includes((child as Element).name)
        );
        if (containsBlockElement) {
          return <>{domToReact(node.children as DOMNode[], { replace: () => null })}</>;
        }
      }
    },
  });
}

// Generate metadata - no changes needed here
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const blog = await fetchBlogBySlugOrId(params.id);
  if (!blog) return { title: 'Blog Not Found' };
  return {
    title: blog.meta?.title || blog.title,
    description: blog.meta?.description || blog.excerpt || 'Blog post description',
  };
}


// --- Main Page Component ---
export default async function BlogDetailPage({ params }: { params: { id: string } }) {
  const blog = await fetchBlogBySlugOrId(params.id);

  if (!blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50/50 to-emerald-50/20">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Blog not found */}
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              {/* Decorative elements */}
              <div className="relative mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">!</span>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-60 animate-pulse"></div>
                <div className="absolute -bottom-2 -left-6 w-6 h-6 bg-gradient-to-br from-pink-400 to-red-500 rounded-full opacity-40 animate-pulse delay-300"></div>
              </div>

              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">
                Blog Not Found
              </h1>
              <p className="text-gray-600 mb-8 leading-relaxed">
                The blog post you're looking for doesn't exist or has been moved. Let's get you back on track!
              </p>

              <a
                href="/blog"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-slate-600 to-emerald-600 text-white font-semibold rounded-2xl hover:from-slate-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <span className="mr-2">📚</span>
                Browse All Blogs
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const headings = blog.longDescription ? extractHeadings(blog.longDescription) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50/50 to-emerald-50/20">


      <div className="relative z-10 container mx-auto px-4 py-8 pb-24">
        {/* 3-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_240px] gap-8 lg:gap-10 xl:gap-12 max-w-7xl xl:max-w-8xl mx-auto">
          {/* Left Sidebar - Table of Contents */}
          <aside className="hidden lg:block bg-transparent">
            <div className="sticky top-24 bg-transparent">
              <TableOfContents />
            </div>
          </aside>

          {/* Main Content */}
          <main>
            <article className="overflow-hidden">
              {/* Hero Image */}
              {blog.image?.url && (
                <div className="relative w-full h-64 md:h-80 lg:h-96">
                  <Image
                    src={blog.image.url}
                    alt={blog.image.alt || blog.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              )}

              {/* Content */}
              <div className="p-6 md:p-8 pb-20">
                {/* Title */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {blog.title}
                </h1>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-gray-600">
                  {blog.author && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      <span>By {typeof blog.author === 'object' ? blog.author.name : blog.author}</span>
                    </div>
                  )}
                  {blog.createdAt && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      <span>{new Date(blog.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </div>
                  )}
                </div>

                {/* Blog Content */}
                {blog.longDescription ? (
                  <article className="blog-content prose prose-lg md:prose-xl lg:prose-xl prose-slate w-full max-w-full md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto leading-relaxed space-y-6 prose-headings:scroll-mt-24 prose-headings:font-bold prose-headings:text-gray-900 prose-headings:leading-tight prose-headings:mt-12 prose-headings:mb-8 prose-h1:text-2xl md:prose-h1:text-3xl lg:prose-h1:text-4xl prose-h2:text-xl md:prose-h2:text-2xl lg:prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-8 prose-h3:text-lg md:prose-h3:text-xl lg:prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-6 prose-p:text-base md:prose-p:text-lg prose-p:text-gray-700 prose-p:leading-loose prose-p:mb-6 prose-a:text-emerald-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline focus:prose-a:outline-none focus:prose-a:ring-2 focus:prose-a:ring-emerald-500 focus:prose-a:ring-offset-2 prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:text-base md:prose-ul:text-lg prose-ul:text-gray-700 prose-ul:space-y-2 prose-ol:text-base md:prose-ol:text-lg prose-ol:text-gray-700 prose-ol:space-y-2 prose-li:text-gray-700 prose-li:leading-relaxed prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50/50 prose-blockquote:rounded-r-lg prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:text-base md:prose-blockquote:text-lg prose-blockquote:italic prose-blockquote:leading-relaxed prose-code:text-sm prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:font-mono prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-img:rounded-lg prose-img:shadow-lg prose-img:mx-auto prose-img:w-full prose-img:my-10">
                    {customParser(blog.longDescription)}
                  </article>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-400 text-2xl">📝</span>
                    </div>
                    <p className="text-gray-500 italic">No content available for this post.</p>
                  </div>
                )}
              </div>
            </article>
          </main>

          {/* Right Sidebar - Recent Blogs */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <RecentBlogs currentBlogId={blog._id} limit={5} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}