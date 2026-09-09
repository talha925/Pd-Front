// app/blog/[id]/page.tsx

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Metadata } from 'next';
import SafeImage from '@/components/ui/SafeImage';
import { notFound } from 'next/navigation';
import parse, { DOMNode, Element, domToReact } from 'html-react-parser';
import config from '@/lib/config';
import { decode } from 'html-entities';
import TableOfContents from '@/components/blog/TableOfContents';
import RecentBlogs from '@/components/blog/RecentBlogs';
import ReadingProgress from '@/components/blog/ReadingProgress';

import BackToTop from '@/components/blog/BackToTop';
import BlogInteractive from '@/components/blog/BlogInteractive';

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
  category?: {
    _id: string;
    name: string;
    slug: string;
  };
}

// NEW HELPER: This function will decode the string repeatedly until it's clean.
// This will fix your "&lt;p&gt;&amp;lt;p&amp;gt;..." and "&amp;amp;" issues.
function decodeRecursively(text: string): string {
  if (!text) return '';
  let newText = decode(text);
  while (newText !== text) {
    text = newText;
    newText = decode(text);
  }
  return newText;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function generateHeadingId(text: string, index: number): string {
  const slug = generateSlug(text);
  return `heading-${index}-${slug}`;
}

function getCleanText(node: Element): string {
  let text = '';
  if (node.children) {
    for (const child of node.children) {
      if ((child as any).type === 'text') {
        text += (child as any).data || '';
      } else if ((child as any).children) {
        text += getCleanText(child as Element);
      }
    }
  }
  return text.trim();
}

function extractHeadingsFromHtml(html: string): Array<{ id: string; text: string; level: number }> {
  if (!html) return [];
  const decodedHtml = decodeRecursively(html);
  const regex = /<h([2-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const headings: Array<{ id: string; text: string; level: number }> = [];
  let match;
  let index = 0;

  while ((match = regex.exec(decodedHtml)) !== null) {
    const level = parseInt(match[1], 10);
    const text = decodeRecursively(match[2].replace(/<[^>]+>/g, '').trim());
    if (!text) continue;

    const lower = text.toLowerCase();
    if (lower.includes('click to reveal') || lower.includes('warning:')) {
      continue;
    }

    const id = generateHeadingId(text, index);
    headings.push({ id, text, level });
    index++;
  }
  return headings;
}

async function fetchBlogBySlugOrId(slugOrId: string): Promise<Blog | null> {
  try {
    console.log(`[Blog Fetch] Searching for blog with slug: ${slugOrId}`);

    // Step 1: Fetch ALL blogs summary
    const listRes = await fetch(`${config.api.baseUrl}/api/blogs?limit=1000`, {
      cache: 'no-store'
    });

    if (!listRes.ok) throw new Error('Failed to fetch blog list');
    const listData = await listRes.json();
    const allBlogs = listData.blogs || (listData.data && listData.data.blogs) || [];

    // Step 2: Find the correct blog
    const foundBlogSummary = allBlogs.find((b: any) => 
      b.slug === slugOrId || 
      b.slug === decodeURIComponent(slugOrId) || 
      b._id === slugOrId
    );
    if (!foundBlogSummary || !foundBlogSummary._id) return null;

    console.log(`[Blog Fetch] Found blog ID: ${foundBlogSummary._id}. Fetching full details...`);

    // Step 3: Fetch full details
    const detailRes = await fetch(`${config.api.baseUrl}/api/blogs/${foundBlogSummary._id}`, {
      cache: 'no-store'
    });

    if (!detailRes.ok) throw new Error('Failed to fetch details');
    const detailData = await detailRes.json();
    const fullBlog = detailData.blog || detailData.data?.blog || detailData.data;

    // If blog is turned off / draft, do not show to public visitors
    if (fullBlog && fullBlog.status && fullBlog.status !== 'published') {
      console.log(`[Blog Fetch] Blog ${foundBlogSummary._id} is hidden (status: ${fullBlog.status})`);
      return null;
    }

    return fullBlog || null;
  } catch (error) {
    console.error('[Blog Fetch] Error:', error);
    return null;
  }
}

// The parser now uses the recursive decoder and attaches matching heading IDs
function customParser(html: string) {
  // First, fully clean the double (or triple) encoded HTML string
  const decodedHtml = decodeRecursively(html);
  let headingCounter = 0;

  return parse(decodedHtml, {
    replace: (domNode) => {
      const node = domNode as Element;
      // Fix for invalid nesting like <p><ul>...</ul></p>
      if (node.name === 'p') {
        const containsBlockElement = node.children?.some(
          (child) =>
            child.type === 'tag' &&
            ['ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'div', 'blockquote'].includes((child as Element).name)
        );
        if (containsBlockElement) {
          return <>{domToReact(node.children as DOMNode[], { replace: () => null })}</>;
        }
      }

      // Assign matching ID to headings for Table of Contents
      if (node.name === 'h2' || node.name === 'h3') {
        const text = getCleanText(node);
        const id = node.attribs?.id || generateHeadingId(text, headingCounter++);
        const Tag = node.name as 'h2' | 'h3';
        const { class: _c, ...cleanAttribs } = node.attribs || {};
        const className = `${node.attribs?.class || ''} scroll-mt-24`.trim();

        return (
          <Tag {...cleanAttribs} id={id} className={className}>
            {domToReact(node.children as DOMNode[])}
          </Tag>
        );
      }
    },
  });
}

// Generate metadata with decoded strings
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const blog = await fetchBlogBySlugOrId(params.id);
  if (!blog) return { title: 'Blog Not Found' };
  const rawTitle = blog.meta?.title || blog.title;
  const rawDesc = blog.meta?.description || blog.excerpt || 'Blog post description';
  return {
    title: decodeRecursively(rawTitle),
    description: decodeRecursively(rawDesc),
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


  const fullUrl = `${config.api.baseUrl}/blog/${blog.slug || params.id}`;
  const decodedTitle = decodeRecursively(blog.title || '');
  const headings = blog.longDescription ? extractHeadingsFromHtml(blog.longDescription) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100/50">
      {/* Reading Progress Indicator */}
      <ReadingProgress />

      <div className="relative z-10 container mx-auto px-4 py-8 pb-24">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-gray-500">
            <li>
              <a href="/" className="hover:text-blue-600 transition-colors">Home</a>
            </li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <a href="/blog" className="hover:text-blue-600 transition-colors">Blog</a>
            </li>
            {blog.category && (
              <li className="flex items-center">
                <span className="mx-2">/</span>
                <a
                  href={`/blog/category/${blog.category.slug}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {blog.category.name}
                </a>
              </li>
            )}
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium line-clamp-1">{decodedTitle}</span>
            </li>
          </ol>
        </nav>

        {/* 3-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_240px] gap-8 lg:gap-10 xl:gap-12 max-w-7xl xl:max-w-8xl mx-auto">
          {/* Left Sidebar - Table of Contents */}
          <aside className="hidden lg:block bg-transparent">
            <div className="sticky-sidebar">
              <TableOfContents headings={headings} />
            </div>
          </aside>

          {/* Main Content */}
          <main>
            <article className="">
              {/* Hero Image */}
              {blog.image?.url && (
                <div className="relative w-full rounded-2xl overflow-hidden mb-8">
                  <SafeImage
                    src={blog.image.url}
                    alt={decodeRecursively(blog.image.alt || blog.title)}
                    width={1200}
                    height={630}
                    className="w-full h-auto object-contain"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw"
                  />
                </div>
              )}

              {/* Content */}
              <div className="">


                {/* Title */}
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-6 text-gray-900 leading-tight tracking-tight">
                  {decodedTitle}
                </h1>





                {/* Blog Content */}
                {blog.longDescription ? (
                  <article className="blog-content prose prose-lg md:prose-xl lg:prose-xl prose-slate w-full max-w-none">
                    <BlogInteractive />
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
            <div className="sticky-sidebar">
              <RecentBlogs currentBlogId={blog._id} limit={5} />
            </div>
          </aside>
        </div>
      </div>

      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
}
