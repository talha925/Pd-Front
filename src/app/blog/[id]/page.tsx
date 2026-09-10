// app/blog/[id]/page.tsx

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Metadata } from 'next';
import SafeImage from '@/components/ui/SafeImage';
import parse, { attributesToProps, DOMNode, Element, domToReact } from 'html-react-parser';
import config from '@/lib/config';
import { decodeRecursively, sanitizeBrandText, cleanTypography } from '@/lib/utils/formatting';
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

// Helper to extract text from AST nodes (same as Waleed-Webiste)
function getTextFromNode(node: any): string {
  if (!node) return '';
  if (node.type === 'text') {
    return node.data || '';
  }
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(getTextFromNode).join('');
  }
  return '';
}

// --- Semantic Blog Content Formatter & Parser from Waleed-Webiste ---
function formatAndParseBlogContent(rawContent: string, brandName: string = 'Penny Scroll', store?: { name?: string; url?: string }) {
  if (!rawContent) return null;

  // 1. Clean recursive encoding and typography artifacts
  const content = sanitizeBrandText(decodeRecursively(rawContent), brandName);

  // 2. Check if content already contains block HTML tags
  const hasHtmlTags = /<\/?(p|div|h[1-6]|ul|ol|li|table|blockquote|section|article|style)\b/i.test(content);

  let formattedHtml = content;

  if (!hasHtmlTags) {
    const rawLines = content
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(l => l.trim());

    const processedBlocks: string[] = [];
    let currentList: string[] = [];
    let isNumberedList = false;

    const flushList = () => {
      if (currentList.length > 0) {
        if (isNumberedList) {
          processedBlocks.push(
            `<ol class="list-decimal pl-6 space-y-2.5 my-6 text-foreground/90 font-medium text-base md:text-lg">${currentList.map(item => `<li>${item}</li>`).join('')}</ol>`
          );
        } else {
          processedBlocks.push(
            `<ul class="list-disc pl-6 space-y-2 my-6 text-foreground/90 text-base md:text-lg">${currentList.map(item => `<li>${item}</li>`).join('')}</ul>`
          );
        }
        currentList = [];
        isNumberedList = false;
      }
    };

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (!line) {
        flushList();
        continue;
      }

      if (line.startsWith('```')) {
        flushList();
        continue;
      }

      const isCtaLine = /^(SHOP\s|BUY\s|GET\s|EXPLORE\s|VISIT\s|.*RECOMMENDS\s)/i.test(line) && line.length < 90;
      if (isCtaLine) {
        flushList();
        const targetUrl = store?.url || '#';
        const cleanedTitle = cleanTypography(line);
        let buttonText = /^SHOP\s/i.test(line) ? `Shop ${store?.name || 'Now'}` : 'Shop Now';
        processedBlocks.push(`
          <div class="my-8 p-6 sm:p-7 rounded-2xl border border-border/80 bg-gradient-to-r from-card via-background-secondary/70 to-card shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-6 not-prose">
            <div class="space-y-2 text-center md:text-left flex-1 min-w-0">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-brand-accent/15 text-brand-accent border border-brand-accent/30 whitespace-nowrap shadow-sm">
                <span>Verified Recommendation</span>
              </div>
              <h4 class="text-xl sm:text-2xl font-black text-foreground pt-1 leading-snug tracking-tight">${cleanedTitle}</h4>
              <p class="text-xs sm:text-sm text-foreground-secondary font-medium">Exclusive deals & verified discounts available for our readers</p>
            </div>
            <a href="${targetUrl}" target="_blank" rel="noopener noreferrer nofollow" class="blog-cta-btn px-8 py-3.5 rounded-full !no-underline uppercase tracking-wider text-xs sm:text-sm font-black shrink-0 cursor-pointer gap-2">
              <span>${buttonText}</span>
            </a>
          </div>
        `);
        continue;
      }

      // Check for Numbered List items
      const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numberedMatch) {
        if (!isNumberedList && currentList.length > 0) flushList();
        isNumberedList = true;
        currentList.push(`<strong>${numberedMatch[2]}</strong>`);
        continue;
      }

      // Check for Bullet points
      const bulletMatch = line.match(/^[-*•]\s+(.*)/);
      if (bulletMatch) {
        if (isNumberedList && currentList.length > 0) flushList();
        isNumberedList = false;
        currentList.push(bulletMatch[1]);
        continue;
      }

      // Check for Short feature list item
      const nextLine = rawLines[i + 1];
      const isShortItem = line.length < 50 && !line.endsWith('.') && !line.endsWith(':') && !line.endsWith('?') &&
        ((nextLine && nextLine.length < 50 && !nextLine.endsWith('.') && !nextLine.endsWith('?')) || currentList.length > 0);

      if (isShortItem && !line.startsWith('##') && !line.startsWith('###')) {
        if (isNumberedList && currentList.length > 0) flushList();
        isNumberedList = false;
        currentList.push(line);
        continue;
      }

      flushList();

      if (line.startsWith('## ') || line.startsWith('### ')) {
        const headingText = line.replace(/^#{2,3}\s+/, '');
        const headingId = headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        processedBlocks.push(`<h2 id="${headingId}" class="text-2xl md:text-3xl font-black text-foreground mt-10 mb-4 tracking-tight scroll-mt-24">${headingText}</h2>`);
        continue;
      }

      const isHeadingPattern = (
        line.endsWith('?') ||
        /^(Best|Why|What|How|Frequently Asked Questions|Conclusion|Summary|Real Owner Experiences|Future Trends|Top Rated|Final Thoughts|Key Takeaways|The Verdict)\b/i.test(line)
      ) && line.length < 80 && !line.endsWith('.');

      if (isHeadingPattern) {
        const headingId = line.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        processedBlocks.push(`<h2 id="${headingId}" class="text-2xl md:text-3xl font-black text-foreground mt-10 mb-4 tracking-tight scroll-mt-24">${line}</h2>`);
        continue;
      }

      processedBlocks.push(`<p class="mb-6 text-base md:text-lg leading-relaxed text-foreground/90 font-normal">${line}</p>`);
    }

    flushList();
    formattedHtml = processedBlocks.join('\n');
  }

  return parse(formattedHtml, {
    replace: (domNode) => {
      const node = domNode as Element;
      if (!node || !node.name) return;

      // Ensure <style> tags render their CSS rules directly in React
      if (node.name === 'style') {
        const cssContent = getTextFromNode(node);
        return <style dangerouslySetInnerHTML={{ __html: decodeRecursively(cssContent) }} />;
      }

      // Handle 2-item or 4-item grids to display 2 columns (complete space)
      if (node.attribs && (node.attribs.class?.includes('mgx-carousel') || node.attribs.class?.includes('mgx-grid'))) {
        const elementChildren = (node.children || []).filter((child: any) => child.type === 'tag');
        if (elementChildren.length === 2) {
          const props = attributesToProps(node.attribs);
          const className = `${node.attribs.class || ''} mgx-grid-2`.trim();
          return (
            <div {...props} className={className}>
              {domToReact(node.children as DOMNode[])}
            </div>
          );
        }
        if (elementChildren.length === 4) {
          const props = attributesToProps(node.attribs);
          const className = `${node.attribs.class || ''} mgx-grid-4`.trim();
          return (
            <div {...props} className={className}>
              {domToReact(node.children as DOMNode[])}
            </div>
          );
        }
      }

      // Ensure all anchor links have clean decoded URLs without %20 or spaces in domain
      if (node.name === 'a' && node.attribs?.href) {
        let href = node.attribs.href;
        href = href.replace(/penny(?:\s+|%20)+scroll\.com/gi, 'pennyscroll.com');
        href = href.replace(/blogzenix\.com/gi, 'pennyscroll.com');
        const props = attributesToProps({ ...node.attribs, href });
        return (
          <a {...props}>
            {domToReact(node.children as DOMNode[])}
          </a>
        );
      }

      // Auto-assign IDs to headings for Table of Contents if not present, while preserving all existing styles/attributes
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.name)) {
        const text = getTextFromNode(node);
        const id = node.attribs?.id || text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const props = attributesToProps(node.attribs || {});
        const Tag = node.name as any;
        return (
          <Tag {...props} id={id}>
            {domToReact(node.children as DOMNode[])}
          </Tag>
        );
      }
    },
  });
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
        <div className="grid grid-cols-1 lg:grid-cols-[190px_minmax(0,1fr)_195px] gap-5 lg:gap-6 xl:gap-8 max-w-7xl xl:max-w-8xl mx-auto">
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
                <div className="relative w-full rounded-2xl overflow-hidden mb-6 shadow-sm border border-slate-200/80 bg-white">
                  <SafeImage
                    src={blog.image.url}
                    alt={decodeRecursively(blog.image.alt || blog.title)}
                    width={1200}
                    height={630}
                    className="w-full h-auto rounded-2xl block"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw"
                  />
                </div>
              )}

              {/* Content */}
              <div className="">
                {/* Title */}
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3.5 text-gray-900 leading-tight tracking-tight">
                  {decodedTitle}
                </h1>

                {/* Blog Content */}
                {blog.longDescription ? (
                  <>
                    <BlogInteractive />
                    <article
                      className={`blog-content w-full max-w-none ${
                        (blog.longDescription || '').includes('mgx-wrap') ? '' : 'prose prose-lg md:prose-xl lg:prose-xl prose-slate'
                      }`}
                    >
                      {formatAndParseBlogContent(blog.longDescription, 'Penny Scroll', (blog as any).store)}
                    </article>
                  </>
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
