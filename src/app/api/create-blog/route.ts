import { NextRequest, NextResponse } from 'next/server';

const API_URL = "https://coupon-app-backend.vercel.app/api/blogs";

const createBlog = async (blogData: any) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(blogData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating blog:', error);
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    const blogData = await request.json();

    // Validate required fields
    if (!blogData.title || !blogData.shortDescription || !blogData.longDescription) {
      return NextResponse.json(
        { 
          error: 'Title, short description, and long description are required fields.' 
        },
        { status: 400 }
      );
    }

    // Validate author object
    if (!blogData.author || typeof blogData.author !== 'object') {
      return NextResponse.json(
        { 
          error: 'Author must be an object with required fields.' 
        },
        { status: 400 }
      );
    }

    if (!blogData.author.name || typeof blogData.author.name !== 'string') {
      return NextResponse.json(
        { 
          error: 'Author name is required and must be a string.' 
        },
        { status: 400 }
      );
    }

    // Validate category object
    if (!blogData.category || typeof blogData.category !== 'object') {
      return NextResponse.json(
        { 
          error: 'Category must be an object with required fields.' 
        },
        { status: 400 }
      );
    }

    if (!blogData.category.id || !blogData.category.name) {
      return NextResponse.json(
        { 
          error: 'Category must have both id and name fields.' 
        },
        { status: 400 }
      );
    }

    // Validate store object - specifically check for URL
    if (!blogData.store || typeof blogData.store !== 'object') {
      return NextResponse.json(
        { 
          error: 'Store must be an object with required fields.' 
        },
        { status: 400 }
      );
    }

    if (!blogData.store.id || !blogData.store.name) {
      return NextResponse.json(
        { 
          error: 'Store must have both id and name fields.' 
        },
        { status: 400 }
      );
    }

    // Validate that store has URL - this is specifically required by the backend
    if (!blogData.store.url || typeof blogData.store.url !== 'string') {
      return NextResponse.json(
        { 
          error: 'Store URL is required and must be a valid string.' 
        },
        { status: 400 }
      );
    }

    // Clean and validate store URL
    let cleanStoreUrl = blogData.store.url;
    
    // Remove HTML entities
    cleanStoreUrl = cleanStoreUrl.replace(/&#x2F;/g, '/');
    
    // Remove any existing protocol to avoid duplication
    cleanStoreUrl = cleanStoreUrl.replace(/^https?:\/\//, '');
    
    // Remove trailing slashes and clean up
    cleanStoreUrl = cleanStoreUrl.replace(/\/+$/, '');
    
    // Add https:// protocol
    cleanStoreUrl = 'https://' + cleanStoreUrl;
    
    // Validate that the URL is a valid URI with protocol
    try {
      const url = new URL(cleanStoreUrl);
      if (!url.protocol || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
        return NextResponse.json(
          { 
            error: 'Store URL must be a valid URI with http:// or https:// protocol.' 
          },
          { status: 400 }
        );
      }
      
      // Additional validation: reject Google search URLs or malformed URLs
      if (url.hostname.includes('google.com') || 
          url.hostname.includes('bing.com') ||
          url.hostname.includes('yahoo.com') ||
          url.searchParams.toString().length > 0 ||
          url.pathname.includes('search') ||
          url.pathname.includes('query')) {
        return NextResponse.json(
          { 
            error: 'Store URL should be a direct website URL, not a search result or query URL.' 
          },
          { status: 400 }
        );
      }
      
      // Validate hostname format
      if (!url.hostname || url.hostname.length < 3) {
        return NextResponse.json(
          { 
            error: 'Store URL must have a valid hostname.' 
          },
          { status: 400 }
        );
      }
      
      // Update the store URL with cleaned version
      blogData.store.url = cleanStoreUrl;
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Store URL must be a valid URI format.' 
        },
        { status: 400 }
      );
    }

    // Validate field lengths
    if (blogData.title.length < 3) {
      return NextResponse.json(
        { 
          error: 'Title must be at least 3 characters long.' 
        },
        { status: 400 }
      );
    }

    if (blogData.shortDescription.length < 10) {
      return NextResponse.json(
        { 
          error: 'Short description must be at least 10 characters long.' 
        },
        { status: 400 }
      );
    }

    if (blogData.longDescription.length < 50) {
      return NextResponse.json(
        { 
          error: 'Long description must be at least 50 characters long.' 
        },
        { status: 400 }
      );
    }

    // Process meta keywords from string to array
    const processKeywords = (keywords: string | string[] | undefined): string[] | undefined => {
      if (!keywords) return undefined;
      
      if (Array.isArray(keywords)) {
        // If already an array, clean and filter
        return keywords
          .map(keyword => keyword.trim())
          .filter(keyword => keyword.length > 0);
      }
      
      // If string, split by comma and clean
      if (typeof keywords === 'string') {
        return keywords
          .split(',')
          .map(keyword => keyword.trim())
          .filter(keyword => keyword.length > 0);
      }
      
      return undefined;
    };

    // Clean up the blog data to ensure proper structure
    const cleanedBlogData = {
      title: blogData.title,
      shortDescription: blogData.shortDescription,
      longDescription: blogData.longDescription,
      author: {
        name: blogData.author.name,
        email: blogData.author.email || undefined,
        avatar: blogData.author.avatar || undefined,
      },
      category: {
        id: blogData.category.id,
        name: blogData.category.name,
        slug: blogData.category.slug || blogData.category.name.toLowerCase().replace(/\s+/g, '-'),
      },
      store: {
        id: blogData.store.id,
        name: blogData.store.name,
        url: blogData.store.url, // This is required by the backend
      },
      status: blogData.status || 'draft',
      isFeaturedForHome: blogData.isFeaturedForHome || blogData.isFeatured || false, // Match backend expectation
      image: blogData.image || undefined,
      tags: blogData.tags || undefined,
      // SEO Metadata with proper keywords array
      meta: blogData.meta ? {
        title: blogData.meta.title || undefined,
        description: blogData.meta.description || undefined,
        keywords: processKeywords(blogData.meta.keywords), // Convert to array
        canonicalUrl: blogData.meta.canonicalUrl || undefined,
        robots: blogData.meta.robots || 'index,follow',
      } : undefined,
      // FAQs
      faqs: blogData.faqs || undefined,
    };

    console.log('Sending blog data to backend:', JSON.stringify(cleanedBlogData, null, 2));
    console.log('Store URL being sent:', cleanedBlogData.store.url);
    console.log('Meta keywords being sent:', cleanedBlogData.meta?.keywords);

    const result = await createBlog(cleanedBlogData);
    
    return NextResponse.json({
      success: true,
      message: 'Blog created successfully!',
      blog: result
    });
  } catch (error) {
    console.error('Failed to create blog:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create blog. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 