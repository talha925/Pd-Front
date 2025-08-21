import Image from 'next/image';
import Link from 'next/link';
import { themeClasses } from '@/lib/theme/utils';

interface BlogCardProps {
  blog: {
    _id: string;
    title: string;
    slug: string; // Required for consistent routing
    image?: {
      url: string;
      alt?: string;
    };
  };
  variant?: string;
}

export default function BlogCard({ blog, variant }: BlogCardProps) {
  return (
    <div className={`group relative ${themeClasses.backgrounds.elevated} rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-[1.02] ${themeClasses.shadows.lg} hover:shadow-xl border ${themeClasses.borders.light}`}>
      {blog.image?.url && (
        <div className="relative h-48 overflow-hidden">
          <Image
            src={blog.image.url}
            alt={blog.image.alt || blog.title}
            width={800}
            height={450}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy" // Use lazy loading for non-critical images
          />

        </div>
      )}
      <div className="p-6">
        <div className="flex items-center mb-4">
          <span className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-full">Blog</span>
          <span className={`ml-2 text-sm ${themeClasses.text.tertiary}`}>5 min read</span>
        </div>
        <h3 className={`text-xl font-bold ${themeClasses.text.primary} mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors`}>{blog.title}</h3>
        <Link
          href={`/blog/${blog.slug || blog._id}`}
          className={`inline-flex items-center ${themeClasses.text.link} transition-colors`}
        >
          Read more
          <svg className="w-4 h-4 ml-2 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}