import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import BlogList from '@/components/blog/BlogList';
import { useBlogCategories } from '@/hooks/useBlogCategories';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

// Function to get category by slug
async function getCategoryBySlug(slug: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/blog-categories`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    
    const data = await response.json();
    const categories = data.data || data || [];
    
    return categories.find((category: any) => category.slug === slug);
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  
  if (!category) {
    return {
      title: 'Category Not Found | BRANDWELL',
      description: 'The requested blog category could not be found.',
    };
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://brandwell.com';
  
  return {
    title: `${category.name} | Blog Categories | BRANDWELL`,
    description: `Explore all blog posts in the ${category.name} category. Discover insights, tips, and stories related to ${category.name}.`,
    keywords: `${category.name}, blog, articles, ${category.name} posts, BRANDWELL`,
    openGraph: {
      title: `${category.name} | Blog Categories | BRANDWELL`,
      description: `Explore all blog posts in the ${category.name} category.`,
      type: 'website',
      url: `${baseUrl}/blog/category/${params.slug}`,
      siteName: 'BRANDWELL',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} | Blog Categories | BRANDWELL`,
      description: `Explore all blog posts in the ${category.name} category.`,
    },
    alternates: {
      canonical: `${baseUrl}/blog/category/${params.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${category.name} Blog Posts`,
        description: `Explore all blog posts in the ${category.name} category. Discover insights, tips, and stories related to ${category.name}.`,
        url: `${baseUrl}/blog/category/${params.slug}`,
        mainEntity: {
          '@type': 'ItemList',
          name: `${category.name} Articles`,
          description: `Collection of blog posts in the ${category.name} category`,
        },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: baseUrl,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Blog',
              item: `${baseUrl}/blog`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: category.name,
              item: `${baseUrl}/blog/category/${params.slug}`,
            },
          ],
        },
        publisher: {
          '@type': 'Organization',
          name: 'BRANDWELL',
          url: baseUrl,
        },
      }),
    },
  };
}

// Generate static params for known categories (optional, for better performance)
export async function generateStaticParams() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/blog-categories`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    const categories = data.data || data || [];
    
    return categories.map((category: any) => ({
      slug: category.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = await getCategoryBySlug(params.slug);
  
  if (!category) {
    // Redirect to main blog page instead of showing not found
    redirect('/blog');
  }
  
  // Construct API endpoint for fetching blogs by category
  const apiEndpoint = `/api/blogs?category=${encodeURIComponent(category.slug)}`;
  
  return (
    <BlogList
      apiEndpoint={apiEndpoint}
      title={`${category.name} Posts`}
      description={`Discover all blog posts in the ${category.name} category`}
      showCreateButton={false}
      emptyStateMessage={`No ${category.name} Posts Yet`}
      emptyStateDescription={`There are no blog posts in the ${category.name} category at the moment. Check back later for new content!`}
    />
  );
}