import Image from "next/image";
import { Metadata } from "next";
import Carousel from "@/components/ui/Carousel";
import NewsletterSubscription from "@/components/ui/NewsletterSubscription";
import BlogCard from "@/components/blog/BlogCard";

interface Blog {
  _id: string;
  title: string;
  slug?: string;
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
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://coupon-app-backend.vercel.app'}/api/blogs?featured=true&page=1&pageSize=6`, {
      next: { revalidate: 3600 } // Revalidate every hour
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
    <div className="w-full bg-gray-900">
      {/* Banner: full width, no padding */}
      <section className="relative h-[80vh] overflow-hidden">
        {/* Client component for carousel */}
        <Carousel images={images} />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-gray-900/50">
          <div className="max-w-7xl mx-auto h-full flex flex-col justify-center px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in leading-tight">
              Discover the Best Deals, Reviews, and
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600"> Lifestyle Tips</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
              Your ultimate guide to smart shopping and better living
            </p>
            <button className="inline-flex items-center px-8 py-4 max-w-[220px] text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 group">
              Explore Now
              <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Boxed content: max-w-7xl, centered, with padding */}
      <section className="max-w-7xl mx-auto py-20 px-4 md:px-12 bg-gray-900">
        <h2 className="text-4xl font-bold text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
          Browse Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Travel Category */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/20 hover:from-cyan-400/30 hover:via-blue-500/30 hover:to-purple-500/30 transition-all duration-700 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/25 border border-cyan-500/20 hover:border-cyan-400/40">
            <div className="relative h-80 overflow-hidden">
              <Image
                src="/image/travel1.jpg"
                alt="Travel Destinations"
                width={800}
                height={400}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/95 via-gray-900/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/30 via-blue-600/20 to-purple-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              {/* Floating elements */}
              <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 w-full p-8 bg-gradient-to-t from-gray-900/90 to-transparent">
              <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-500 transition-all duration-500">
                ✈️ Travel & Adventure
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed opacity-90 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                Discover breathtaking destinations, insider travel tips, and exclusive deals for your next unforgettable journey
              </p>
              <div className="mt-4 flex items-center text-cyan-400 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200">
                <span className="text-sm font-semibold">Explore Now</span>
                <svg className="w-4 h-4 ml-2 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Health & Wellness Category */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/20 via-green-600/20 to-teal-600/20 hover:from-emerald-400/30 hover:via-green-500/30 hover:to-teal-500/30 transition-all duration-700 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/25 border border-emerald-500/20 hover:border-emerald-400/40">
            <div className="relative h-80 overflow-hidden">
              <Image
                src="/image/health1.jpg"
                alt="Health & Wellness"
                width={800}
                height={400}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/95 via-gray-900/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/30 via-green-600/20 to-teal-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              {/* Floating elements */}
              <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 w-full p-8 bg-gradient-to-t from-gray-900/90 to-transparent">
              <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-emerald-400 group-hover:to-green-500 transition-all duration-500">
                🌿 Health & Wellness
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed opacity-90 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                Transform your lifestyle with expert health advice, wellness tips, and reviews of premium health products
              </p>
              <div className="mt-4 flex items-center text-emerald-400 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200">
                <span className="text-sm font-semibold">Discover More</span>
                <svg className="w-4 h-4 ml-2 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Lifestyle Category */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500/20 via-pink-600/20 to-purple-600/20 hover:from-rose-400/30 hover:via-pink-500/30 hover:to-purple-500/30 transition-all duration-700 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-rose-500/25 border border-rose-500/20 hover:border-rose-400/40">
            <div className="relative h-80 overflow-hidden">
              <Image
                src="/image/fashion1.jpg"
                alt="Lifestyle & Fashion"
                width={800}
                height={400}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/95 via-gray-900/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-rose-600/30 via-pink-600/20 to-purple-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              {/* Floating elements */}
              <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 w-full p-8 bg-gradient-to-t from-gray-900/90 to-transparent">
              <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-rose-400 group-hover:to-pink-500 transition-all duration-500">
                ✨ Lifestyle & Fashion
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed opacity-90 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                Elevate your style with the latest fashion trends, lifestyle inspiration, and curated product recommendations
              </p>
              <div className="mt-4 flex items-center text-rose-400 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200">
                <span className="text-sm font-semibold">Get Inspired</span>
                <svg className="w-4 h-4 ml-2 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Technology Category */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500/20 via-purple-600/20 to-indigo-600/20 hover:from-violet-400/30 hover:via-purple-500/30 hover:to-indigo-500/30 transition-all duration-700 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-500/25 border border-violet-500/20 hover:border-violet-400/40">
            <div className="relative h-80 overflow-hidden">
              <Image
                src="/image/app.png"
                alt="Technology & Apps"
                width={800}
                height={400}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/95 via-gray-900/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 via-purple-600/20 to-indigo-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              {/* Floating elements */}
              <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-r from-violet-400 to-purple-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 w-full p-8 bg-gradient-to-t from-gray-900/90 to-transparent">
              <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-400 group-hover:to-purple-500 transition-all duration-500">
                🚀 Technology & Apps
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed opacity-90 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                Stay ahead with cutting-edge tech reviews, app recommendations, and digital innovation insights
              </p>
              <div className="mt-4 flex items-center text-violet-400 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200">
                <span className="text-sm font-semibold">Explore Tech</span>
                <svg className="w-4 h-4 ml-2 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-12 py-16 bg-gray-900">
        <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 font-bold text-3xl mb-12 text-center">Featured Blogs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredBlogs.length === 0 ? (
            <div className="col-span-3 text-center text-gray-400">No featured blogs found.</div>
          ) : (
            featuredBlogs.map((blog: Blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))
          )}
        </div>
      </section>

      {/* Footer: full width */}
      <footer className="bg-gradient-to-b from-gray-900 to-black text-white py-20 w-full border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Newsletter Signup */}
            <div className="lg:col-span-2">
              <NewsletterSubscription />
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Quick Links</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-600 transition-all duration-300">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-600 transition-all duration-300">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-600 transition-all duration-300">Terms & Conditions</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-600 transition-all duration-300">Contact Us</a></li>
                <li><a href="/Coupons" className="text-gray-400 hover:text-white hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-600 transition-all duration-300">Coupons</a></li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Categories</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-600 transition-all duration-300">Travel</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-600 transition-all duration-300">Health</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-600 transition-all duration-300">Lifestyle</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-600 transition-all duration-300">Technology</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-16 pt-8 text-center">
            <p className="text-gray-400 text-lg">
              2024 Bloggydeals. We may earn a commission if you use our links/coupons.
            </p>
          </div>
        </div>
      </footer>
    </div>

  );
}
