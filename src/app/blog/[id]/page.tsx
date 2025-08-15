// app/blog/[id]/page.tsx

import { Metadata } from 'next';
import Image from 'next/image';
import parse, { DOMNode, Element, domToReact } from 'html-react-parser';
import config from '@/lib/config';
import { decode } from 'html-entities';

// Blog Type Interface (No changes)
interface Blog {
  _id: string;
  title: string;
  slug?: string;
  longDescription?: string;
  image?: { url: string; alt?: string; };
  meta?: { title?: string; description?: string; keywords?: string; };
  excerpt?: string;
  createdAt?: string;
  author?: string;
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

// REBUILT & ROBUST: This function now correctly finds the right blog.
// WHY: Your API's slug filter isn't working, so we fetch the whole list and find the blog ourselves.
// This is the most reliable way and mimics your old working client-side logic.
async function fetchBlogBySlugOrId(slugOrId: string): Promise<Blog | null> {
    try {
        console.log(`Searching for blog with slug: ${slugOrId}`);

        // Step 1: Fetch ALL blogs from the general endpoint.
        const listRes = await fetch(`${config.api.baseUrl}/api/blogs`, {
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
        const fullBlog = detailData.blog || detailData.data;

        console.log('Successfully fetched full blog data.');
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
      <div className="flex justify-center items-center h-40">
        <span className="text-lg text-red-600">Blog not found. Please check the URL.</span>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-8">
      {blog.image?.url && (
        <div className="relative w-full h-auto mb-6">
          <Image
            src={blog.image.url}
            alt={blog.image.alt || blog.title}
            width={800}
            height={400}
            className="rounded-lg object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </div>
      )}

      <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">{blog.title}</h1>

      {blog.longDescription ? (
        <div className="prose prose-lg max-w-none">
          {customParser(blog.longDescription)}
        </div>
      ) : (
        <div className="text-gray-500 italic">No content available for this post.</div>
      )}
    </article>
  );
}