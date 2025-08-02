import Image from 'next/image';
import Link from 'next/link';

interface BlogCardProps {
  blog: {
    _id: string;
    title: string;
    slug?: string;
    image?: {
      url: string;
      alt?: string;
    };
  };
}

export default function BlogCard({ blog }: BlogCardProps) {
  return (
    <div className="group relative bg-gray-800 rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20">
      {blog.image?.url && (
        <div className="relative h-48 overflow-hidden">
          <Image
            src={blog.image.url}
            alt={blog.image.alt || blog.title}
            width={800}
            height={450}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy" // Use lazy loading for non-critical images
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60" />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center mb-4">
          <span className="px-3 py-1 text-xs font-semibold text-purple-400 bg-purple-900/30 rounded-full">Blog</span>
          <span className="ml-2 text-sm text-gray-400">5 min read</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-purple-400 transition-colors">{blog.title}</h3>
        <Link
          href={`/blog/${blog.slug || blog._id}`}
          className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
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