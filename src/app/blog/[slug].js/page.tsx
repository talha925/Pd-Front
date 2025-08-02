import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

// Define the Blog interface
interface Blog {
  _id: string;
  title: string;
  content?: string;
  excerpt?: string;
  slug?: string;
  author?: string;
  createdAt?: string;
  image?: {
    url: string;
    alt?: string;
  };
  meta?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const blog = await fetchBlogBySlug(params.slug);

  if (!blog) {
    return {
      title: 'Blog Not Found',
      description: 'The requested blog post could not be found.',
    };
  }

  return {
    title: blog.meta?.title || blog.title,
    description: blog.meta?.description || blog.excerpt || `Read more about ${blog.title}`,
    keywords: blog.meta?.keywords,
    openGraph: {
      title: blog.meta?.title || blog.title,
      description: blog.meta?.description || blog.excerpt || `Read more about ${blog.title}`,
      images: blog.image?.url ? [blog.image.url] : [],
      type: 'article',
      publishedTime: blog.createdAt,
      authors: blog.author ? [blog.author] : [],
    },
    alternates: {
      canonical: `https://brandwell.com/blog/${params.slug}`,
    },
  };
}

// Generate static paths at build time
export async function generateStaticParams() {
  const blogs = await fetchBlogs();
  
  return blogs.map((blog) => ({
    slug: blog.slug || blog._id,
  }));
}

// Fetch a single blog by slug
async function fetchBlogBySlug(slug: string): Promise<Blog | null> {
  try {
    const res = await fetch(`https://coupon-app-backend.vercel.app/api/blogs/${slug}`);
    if (!res.ok) return null;

    const data = await res.json();
    return data.blog || null;
  } catch (error) {
    console.error('Error fetching blog by slug:', error);
    return null;
  }
}

// Fetch all blogs for static generation
async function fetchBlogs(): Promise<Blog[]> {
  try {
    const res = await fetch('https://coupon-app-backend.vercel.app/api/blogs');
    if (!res.ok) return [];

    const data = await res.json();
    return data.blogs?.blogs || data.data?.blogs || [];
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return [];
  }
}

// Blog post page component
export default async function BlogPost({ params }: { params: { slug: string } }) {
  const blog = await fetchBlogBySlug(params.slug);

  if (!blog) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Blog Post Not Found</h1>
        <p className="text-gray-400 mb-8">The blog post you're looking for doesn't exist or has been removed.</p>
        <Link href="/" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold hover:opacity-90 transition-all duration-300">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero section */}
      <header className="mb-12">
        {blog.image?.url && (
          <div className="relative h-[50vh] mb-8 rounded-2xl overflow-hidden">
            <Image
              src={blog.image.url}
              alt={blog.image.alt || blog.title}
              width={1200}
              height={630}
              className="w-full h-full object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60" />
          </div>
        )}

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{blog.title}</h1>

        <div className="flex items-center text-gray-400 mb-8">
          {blog.author && <span className="mr-4">By {blog.author}</span>}
          {blog.createdAt && (
            <span>
              {new Date(blog.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          )}
        </div>

        {blog.excerpt && (
          <p className="text-xl text-gray-300 leading-relaxed">{blog.excerpt}</p>
        )}
      </header>

      {/* Blog content */}
      <div className="prose prose-lg prose-invert max-w-none">
        {blog.content ? (
          <div dangerouslySetInnerHTML={{ __html: blog.content }} />
        ) : (
          <p className="text-gray-400">No content available for this blog post.</p>
        )}
      </div>

      {/* Back to blogs link */}
      <div className="mt-12 pt-8 border-t border-gray-800">
        <Link href="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to all blogs
        </Link>
      </div>
    </article>
  );
}
