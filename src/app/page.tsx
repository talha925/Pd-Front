import Image from "next/image";

import { Metadata } from "next";
import Carousel from "@/components/ui/Carousel";
import BlogCard from "@/components/blog/BlogCard";
import config from '@/lib/config';
import { themeClasses } from '@/lib/theme/utils';

interface Blog {
  _id: string;
  title: string;
  slug: string; // Required for consistent routing
  image?: {
    url: string;
    alt?: string;
  };
}

// Define metadata for SEO
export const metadata: Metadata = {
  title: 'Featured Blogs | Brandwell',
  description: 'Discover our featured blogs with the latest trends, tips, and insights across travel, health, lifestyle, and technology.',
  openGraph: {
    title: 'Featured Blogs | Brandwell',
    description: 'Discover our featured blogs with the latest trends, tips, and insights across travel, health, lifestyle, and technology.',
    images: ['/image/travel1.jpg'],
  },
};

// Fetch data at build time or with revalidation
async function fetchFeaturedBlogs() {
  try {
    const res = await fetch(`${config.api.baseUrl}/api/blogs?featured=true&page=1&pageSize=6`, {
      next: { revalidate: 3600, tags: ['featured-blogs'] } // Revalidate every hour or when tagged
    });
    
    if (!res.ok) throw new Error('Failed to fetch blogs');
    
    const data = await res.json();
    return data.blogs?.blogs || data.data?.blogs || [];
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return [];
  }
}

export default async function Blogs() {
  // Fetch data server-side
  const featuredBlogs = await fetchFeaturedBlogs();
  
  // These will be client-side state variables
  // We'll use them with "use client" directives in a client component
  const images = [
    "/image/travel1.jpg",
    "/image/health1.jpg",
    "/image/sport.png",
    "/image/travel1.jpg",
    "/image/app.png",
    "/image/home-(3).png",
    "/image/bali.png",
    "/image/fashion1.jpg",
  ];

  // Client-side functionality will be moved to a separate component

  return (
    <div className={`w-full ${themeClasses.backgrounds.primary}`}>
      {/* Banner: full width, no padding */}
      <section className="relative h-[80vh] overflow-hidden">
        {/* Client component for carousel */}
        <Carousel images={images} />
        <div className="absolute inset-0">
          <div className="max-w-7xl mx-auto h-full flex flex-col justify-center px-4 sm:px-6 lg:px-8">
            <h1 className={`text-4xl md:text-6xl font-bold ${themeClasses.text.primary} mb-6 animate-fade-in leading-tight drop-shadow-lg`}>
              Discover the Best Deals, Reviews, and
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 drop-shadow-lg"> Lifestyle Tips</span>
            </h1>
            <p className={`text-xl ${themeClasses.text.secondary} mb-8 max-w-2xl leading-relaxed drop-shadow-md`}>
              Your ultimate guide to smart shopping and better living
            </p>
    
            <button className={`inline-flex items-center px-8 py-4 max-w-[220px] text-lg font-semibold ${themeClasses.text.inverse} bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 group`}>
              Explore Now
              <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Boxed content: max-w-7xl, centered, with padding */}
      <section className={`max-w-7xl mx-auto py-20 px-4 md:px-12`}>
        <h2 className={`text-4xl font-bold text-center mb-16 ${themeClasses.text.primary} bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600`}>
          Browse Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Health Category */}
          <div className="group relative overflow-hidden bg-card/80 backdrop-blur-md border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="relative h-80 overflow-hidden">
              <Image
                src="/image/travel1.jpg"
                alt="Travel Destinations"
                width={800}
                height={400}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />


            </div>
            <div className="absolute bottom-0 w-full p-8 bg-gradient-to-t from-black/60 to-transparent">
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors duration-300">
                ✈️ Travel & Adventure
              </h3>
              <p className="text-white/90 text-base leading-relaxed group-hover:text-white transition-colors duration-300">
                Discover amazing destinations and travel tips
              </p>
            </div>
          </div>

          {/* Health & Wellness Category */}
          <div className="group relative overflow-hidden bg-card/80 backdrop-blur-md border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="relative h-80 overflow-hidden">
              <Image
                src="/image/health1.jpg"
                alt="Health & Wellness"
                width={800}
                height={400}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />


            </div>
            <div className="absolute bottom-0 w-full p-8 bg-gradient-to-t from-black/60 to-transparent">
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors duration-300">
                🌿 Health & Wellness
              </h3>
              <p className="text-white/90 text-base leading-relaxed group-hover:text-white transition-colors duration-300">
                Expert health advice and wellness tips
              </p>
            </div>
          </div>

          {/* Lifestyle Category */}
          <div className="group relative overflow-hidden bg-card/80 backdrop-blur-md border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="relative h-80 overflow-hidden">
              <Image
                src="/image/fashion1.jpg"
                alt="Lifestyle & Fashion"
                width={800}
                height={400}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />


            </div>
            <div className="absolute bottom-0 w-full p-8 bg-gradient-to-t from-black/60 to-transparent">
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-rose-300 transition-colors duration-300">
                ✨ Lifestyle & Fashion
              </h3>
              <p className="text-white/90 text-base leading-relaxed group-hover:text-white transition-colors duration-300">
                Latest fashion trends and lifestyle inspiration
              </p>
            </div>
          </div>

          {/* Technology Category */}
          <div className="group relative overflow-hidden bg-card/80 backdrop-blur-md border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="relative h-80 overflow-hidden">
              <Image
                src="/image/app.png"
                alt="Technology & Apps"
                width={800}
                height={400}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />


            </div>
            <div className="absolute bottom-0 w-full p-8 bg-gradient-to-t from-black/60 to-transparent">
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-violet-300 transition-colors duration-300">
                🚀 Technology & Apps
              </h3>
              <p className="text-white/90 text-base leading-relaxed group-hover:text-white transition-colors duration-300">
                Latest tech reviews and app recommendations
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={`max-w-7xl mx-auto px-4 md:px-12 py-16 ${themeClasses.backgrounds.primary}`}>
        <h2 className={`${themeClasses.text.primary} bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-bold text-3xl mb-12 text-center`}>Featured Blogs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredBlogs.length === 0 ? (
            <div className={`col-span-3 text-center ${themeClasses.text.secondary}`}>No featured blogs found.</div>
          ) : (
            featuredBlogs.map((blog: Blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))
          )}
        </div>
      </section>
    </div>

  );
}
