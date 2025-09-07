'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Blog } from '@/lib/types/blog';
import { themeClasses } from '@/lib/theme/utils';

interface HeroBannerProps {
  className?: string;
}

export default function HeroBanner({ className = '' }: HeroBannerProps) {
  const [bannerBlogs, setBannerBlogs] = useState<Blog[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBannerBlogs = async () => {
    try {
      setLoading(true);
      // Add cache-busting headers and timestamp to ensure fresh data
      const timestamp = Date.now();
      const response = await fetch(`/api/blogs?status=published&limit=20&_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch banner blogs');
      }
      
      const data = await response.json();
      const allBlogs = data.blogs || [];
        
      console.log('HeroBanner - All blogs:', allBlogs.length);
      console.log('HeroBanner - Sample blog:', allBlogs[0]);
      
      // Filter blogs with FrontBanner === true on frontend since backend filtering is not working
      const filteredBlogs = allBlogs.filter((blog: any) => {
        const isFrontBanner = blog.FrontBanner === true || blog.FrontBanner === 'True' || blog.FrontBanner === 'true';
        console.log(`Blog "${blog.title}": FrontBanner=${blog.FrontBanner}, isFrontBanner=${isFrontBanner}`);
        return isFrontBanner;
      }).slice(0, 5);
      
      console.log('HeroBanner - Filtered blogs:', filteredBlogs.length);
      setBannerBlogs(filteredBlogs);
      setError(null);
    } catch (err) {
      console.error('Error fetching banner blogs:', err);
      setError('Failed to load banner blogs');
      setBannerBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBannerBlogs();
  }, []);

  // Refresh when window gains focus (user returns from admin panel)
  // Only refresh if user was away for more than 5 seconds to avoid tab switching issues
  useEffect(() => {
    let lastBlurTime = 0;
    
    const handleBlur = () => {
      lastBlurTime = Date.now();
    };
    
    const handleFocus = () => {
      const timeSinceBlur = Date.now() - lastBlurTime;
      // Only refresh if user was away for more than 5 seconds (likely from admin panel)
      if (timeSinceBlur > 5000) {
        fetchBannerBlogs();
      }
    };
    
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    if (bannerBlogs.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % bannerBlogs.length);
      }, 6000); // 6 seconds per slide

      return () => clearInterval(interval);
    }
  }, [bannerBlogs.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerBlogs.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerBlogs.length) % bannerBlogs.length);
  };

  if (loading) {
    return (
      <div className={`relative h-64 md:h-80 lg:h-96 ${className} overflow-hidden mt-8 mb-12 rounded-3xl shadow-2xl`}>
        {/* Enhanced Shimmer Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-purple-100 animate-pulse" />
        
        {/* Shimmer Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" 
             style={{
               backgroundSize: '200% 100%',
               animation: 'shimmer 2s infinite linear'
             }} />
        
        {/* Enhanced Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-md border border-white/20" />
        
        {/* Content Skeleton */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-700 px-6 md:px-12 max-w-5xl">
            {/* Title Skeleton */}
            <div className="h-10 md:h-14 lg:h-18 bg-gradient-to-r from-blue-200/60 to-purple-200/60 rounded-2xl mb-6 animate-pulse shadow-lg" />
            <div className="h-6 md:h-8 bg-gradient-to-r from-gray-200/60 to-blue-200/60 rounded-xl mb-10 max-w-3xl mx-auto animate-pulse shadow-md" />
            {/* Button Skeleton */}
            <div className="h-14 w-48 bg-gradient-to-r from-purple-200/60 to-pink-200/60 rounded-2xl mx-auto animate-pulse shadow-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Don't show anything if there's an error
  }

  if (bannerBlogs.length === 0) {
    return (
      <div className={`relative h-64 md:h-80 lg:h-96 overflow-hidden rounded-3xl mt-8 mb-12 shadow-2xl ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-700 px-6 md:px-12 max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">No Featured Blogs</h2>
            <p className="text-lg text-gray-600 mb-6">No blogs are currently marked as front banner.</p>
            <button
              onClick={fetchBannerBlogs}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentBlog = bannerBlogs[currentSlide];

  return (
    <div className={`relative h-64 md:h-80 lg:h-96 overflow-hidden rounded-3xl mt-8 mb-12 shadow-2xl group ${className}`}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={currentBlog.image?.url || '/images/default-blog.jpg'}
          alt={currentBlog.image?.alt || currentBlog.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
        />
        {/* Multi-layer Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/10 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      {/* Glassmorphism Content Overlay */}
      <div className="absolute inset-0 flex items-center justify-start">
        <div className="text-left text-white px-6 md:px-12 max-w-4xl ml-8 md:ml-12 lg:ml-16">
          {/* Enhanced Glassmorphism Card */}
          <div className="backdrop-blur-lg bg-white/5 rounded-3xl p-4 md:p-6 border border-white/15 shadow-2xl hover:bg-white/8 transition-all duration-500">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 leading-relaxed bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent drop-shadow-2xl break-words max-w-full whitespace-pre-wrap">
              {currentBlog.title && currentBlog.title.length > 40 
                ? currentBlog.title.replace(/(.{1,25})(\s|$)/g, '$1\n').trim()
                : currentBlog.title}
            </h1>
            <p className="text-sm md:text-base lg:text-lg mb-4 opacity-95 max-w-2xl leading-relaxed text-white/95 drop-shadow-lg break-words">
              {(() => {
                if (!currentBlog.shortDescription) return '';
                // Match title length - approximately 40-50 characters
                if (currentBlog.shortDescription.length <= 50) return currentBlog.shortDescription;
                return currentBlog.shortDescription.substring(0, 47) + '...';
              })()}
            </p>
            <Link
              href={`/blog/${currentBlog.slug || currentBlog._id}`}
              className="group inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-pink-600/90 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all duration-500 shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-1 border border-white/30 backdrop-blur-sm"
            >
              <span className="text-sm">Explore Now</span>
              <svg
                className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Arrows (only show if multiple blogs) */}
      {bannerBlogs.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white w-14 h-14 rounded-2xl cursor-pointer z-10 flex items-center justify-center transition-all duration-500 border border-white/25 hover:border-white/40 shadow-xl hover:shadow-2xl hover:scale-110 group"
            aria-label="Previous blog"
          >
            <svg className="w-7 h-7 transition-transform duration-300 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white w-14 h-14 rounded-2xl cursor-pointer z-10 flex items-center justify-center transition-all duration-500 border border-white/25 hover:border-white/40 shadow-xl hover:shadow-2xl hover:scale-110 group"
            aria-label="Next blog"
          >
            <svg className="w-7 h-7 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Slide Indicators (only show if multiple blogs) */}
      {bannerBlogs.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {bannerBlogs.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-4 h-4 rounded-full transition-all duration-500 border-2 ${
                index === currentSlide
                  ? 'bg-white border-white shadow-lg scale-125'
                  : 'bg-white/30 border-white/50 hover:bg-white/60 hover:border-white/80 hover:scale-110'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}