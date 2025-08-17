import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * API route for on-demand revalidation of cached pages and data
 * Supports revalidation by path, tag, or specific content types
 */
export async function POST(request: NextRequest) {
  try {
    const { type, path, tag, blogId, storeId, secret } = await request.json();

    // Verify secret token for security
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    switch (type) {
      case 'path':
        if (!path) {
          return NextResponse.json({ error: 'Path is required for path revalidation' }, { status: 400 });
        }
        revalidatePath(path);
        return NextResponse.json({ message: `Revalidated path: ${path}` });

      case 'tag':
        if (!tag) {
          return NextResponse.json({ error: 'Tag is required for tag revalidation' }, { status: 400 });
        }
        revalidateTag(tag);
        return NextResponse.json({ message: `Revalidated tag: ${tag}` });

      case 'blog':
        // Revalidate blog-related pages and tags
        revalidatePath('/blog');
        revalidateTag('blogs');
        if (blogId) {
          revalidatePath(`/blog/${blogId}`);
          revalidateTag(`blog-${blogId}`);
        }
        return NextResponse.json({ message: 'Revalidated blog pages' });

      case 'stores':
        // Revalidate stores-related pages and tags
        revalidatePath('/stores');
        revalidateTag('stores');
        if (storeId) {
          revalidatePath(`/store/${storeId}`);
          revalidateTag(`store-${storeId}`);
        }
        return NextResponse.json({ message: 'Revalidated stores pages' });

      case 'categories':
        // Revalidate categories-related pages and tags
        revalidatePath('/Categories');
        revalidateTag('categories');
        return NextResponse.json({ message: 'Revalidated categories pages' });

      case 'all':
        // Revalidate all pages
        revalidatePath('/blog');
        revalidateTag('blogs');
        revalidatePath('/stores');
        revalidateTag('stores');
        revalidatePath('/Categories');
        revalidateTag('categories');
        return NextResponse.json({ message: 'Revalidated all pages' });

      default:
        return NextResponse.json({ error: 'Invalid revalidation type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({ message: 'Revalidation API is running' });
}