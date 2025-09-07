import Image from 'next/image';
import Link from 'next/link';
import { themeClasses } from '@/lib/theme/utils';

interface BlogCardProps {
  blog: {
    _id: string;
    title: string;
    slug: string; // Required for consistent routing
    shortDescription?: string;
    image?: {
      url: string;
      alt?: string;
    };
  };
  variant?: string;
}

export default function BlogCard({ blog, variant }: BlogCardProps) {
  return (
    <Link href={`/blog/${blog.slug || blog._id}`} className="block">
      <div className="group relative bg-white/80 backdrop-blur-sm border border-indigo-200/40 rounded-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.03] shadow-xl hover:shadow-2xl hover:border-indigo-300/60 hover:bg-white/90 cursor-pointer">
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
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full border border-indigo-200/50 flex-shrink-0">Blog</span>
              <h2 className="text-base md:text-lg font-bold text-slate-800 break-words leading-snug hover:text-indigo-700 transition-colors duration-300 flex-1 min-w-0">
                {blog.title}
              </h2>
            </div>
          </div>
          {blog.shortDescription && (
            <p className="text-sm text-slate-600 mb-4 line-clamp-2 break-words leading-snug">
              {blog.shortDescription}
            </p>
          )}
          <div className="inline-flex items-center text-indigo-600 hover:text-purple-600 transition-all duration-300 font-medium hover:translate-x-1">
            Read more
            <svg className="w-4 h-4 ml-2 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}