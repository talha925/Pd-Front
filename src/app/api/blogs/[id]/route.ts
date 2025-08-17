import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import config from '@/lib/config';

const API_URL = `${config.api.baseUrl}/api/blogs`;

// GET /api/blogs/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }); 
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ message: 'Blog not found' }, { status: 404 });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json({ blog: data.data || data || null });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch blog', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// PUT /api/blogs/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const formData = await request.json();
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Revalidate blog-related pages and tags after update
    revalidatePath('/blog');
    revalidatePath(`/blog/${id}`);
    revalidateTag('blogs');
    revalidateTag(`blog-${id}`);
    
    return NextResponse.json({ updatedBlog: data.data || data || null });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update blog', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// DELETE /api/blogs/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ message: 'Blog not found' }, { status: 404 });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Revalidate blog-related pages and tags after deletion
    revalidatePath('/blog');
    revalidatePath(`/blog/${id}`);
    revalidateTag('blogs');
    revalidateTag(`blog-${id}`);
    
    return NextResponse.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to delete blog', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

