"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import HttpClient from "@/services/HttpClient";
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { decode } from 'html-entities';

function decodeRecursively(text: string): string {
  if (!text) return '';
  let newText = decode(text);
  let limit = 0;
  while (newText !== text && limit < 5) {
    text = newText;
    newText = decode(text);
    limit++;
  }
  return newText;
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface Blog {
  _id: string;
  title: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  publishDate?: string;
  store: {
    id: string;
    name: string;
  };
}

const sortBlogsNewestFirst = (list: Blog[]) => {
  return [...list].sort((a: any, b: any) => {
    const dateA = new Date(a.createdAt || a.updatedAt || a.publishDate || 0).getTime();
    const dateB = new Date(b.createdAt || b.updatedAt || b.publishDate || 0).getTime();
    return dateB - dateA;
  });
};

interface Category {
  _id: string;
  name: string;
}

export default function AdminBlogsPage() {
  const { isAuthenticated, isLoading } = useUnifiedAuth();
  const router = useRouter();
  const httpClient = new HttpClient();

  // All hooks must be called before any conditional returns
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const pageSize = 10;
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Handle mounting state to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, isLoading, router]);

  // Refresh blogs when window gains focus (user returns from edit/create)
  // Only refresh if user was away for more than 5 seconds to avoid tab switching issues
  useEffect(() => {
    let lastBlurTime = 0;

    const handleBlur = () => {
      lastBlurTime = Date.now();
    };

    const handleFocus = () => {
      const timeSinceBlur = Date.now() - lastBlurTime;
      // Only refresh if user was away for more than 5 seconds (likely from edit/create page)
      if (timeSinceBlur > 5000) {
        setLoading(true);
        const params = new URLSearchParams();
        if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedDate) params.append('date', selectedDate);
        if (selectedStatus === 'all') {
          params.append('all', 'true');
        } else {
          params.append('status', selectedStatus);
        }
        params.append('sort', '-createdAt');
        params.append('page', page.toString());
        params.append('limit', pageSize.toString());

        httpClient.get(`/api/blogs?${params.toString()}`)
          .then((data) => {
            const { blogs, pagination } = data;
            setBlogs(sortBlogsNewestFirst(blogs || []));
            setTotalPages((pagination && pagination.pages) || 1);
          })
          .catch((error) => {
            console.error('Error fetching blogs:', error);
          })
          .finally(() => setLoading(false));
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [debouncedSearchTerm, selectedCategory, selectedDate, selectedStatus, page, pageSize]);

  // Fetch categories
  useEffect(() => {
    httpClient.get("/api/blog-categories").then((data) => {
      setCategories(data.data || data || []);
    });
  }, []);

  // Fetch blogs with filters and pagination
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
    if (selectedCategory) params.append('category', selectedCategory);
    if (selectedDate) params.append('date', selectedDate);
    if (selectedStatus === 'all') {
      params.append('all', 'true');
    } else {
      params.append('status', selectedStatus);
    }
    params.append('sort', '-createdAt');
    params.append('page', String(page));
    params.append('pageSize', String(pageSize));
    params.append('limit', String(pageSize));

    httpClient.get(`/api/blogs?${params.toString()}`)
      .then((response) => {
        const { blogs, success, pagination } = response;
        if (success && blogs && Array.isArray(blogs)) {
          setBlogs(sortBlogsNewestFirst(blogs));
          setTotalPages((pagination && pagination.pages) || 1);
        } else {
          setBlogs([]);
          setTotalPages(1);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [debouncedSearchTerm, selectedCategory, selectedDate, selectedStatus, page]);

  // Delete blog handler
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Are you sure you want to delete this blog?")) return;
      try {
        // Find the blog to check if it has FrontBanner enabled
        const blogToDelete = blogs.find(blog => blog._id === id);

        await httpClient.delete(`/api/blogs/${id}`);
        setBlogs((prev) => prev.filter((blog) => blog._id !== id));

        // Clear banner cache if the deleted blog had FrontBanner enabled
        // Note: We check for FrontBanner property, but it might not be in the list view
        // So we clear cache for any deletion to be safe
        if (blogToDelete && (blogToDelete as any).FrontBanner) {
          localStorage.removeItem('heroBannerData');
          console.log('Banner cache cleared due to FrontBanner blog deletion');
        } else {
          // Clear cache anyway since we can't be sure from list view
          localStorage.removeItem('heroBannerData');
          console.log('Banner cache cleared due to blog deletion (safety measure)');
        }
      } catch (err) {
        alert("Failed to delete blog. Please try again.");
      }
    },
    [blogs]
  );

  // Edit blog handler
  const handleEdit = useCallback((id: string) => {
    router.push(`/admin/blogs/${id}/edit`);
  }, [router]);

  // Toggle blog show/hide status handler
  const handleToggleStatus = useCallback(
    async (blog: Blog) => {
      const currentStatus = blog.status || 'draft';
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      setTogglingId(blog._id);
      try {
        await httpClient.put(`/api/blogs/${blog._id}`, {
          status: newStatus,
        });

        // Clear banner cache if relevant
        if ((blog as any).FrontBanner || (blog as any).frontBanner) {
          localStorage.removeItem('heroBannerData');
        }

        // Update local list state immediately
        setBlogs((prev) =>
          prev.map((b) => (b._id === blog._id ? { ...b, status: newStatus } : b))
        );
      } catch (err) {
        console.error("Failed to toggle status:", err);
        alert("Failed to update blog visibility. Please try again.");
      } finally {
        setTogglingId(null);
      }
    },
    [httpClient]
  );

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className="flex justify-center items-center h-40"><span className="text-lg text-gray-600">Loading...</span></div>;
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-40"><span className="text-lg text-gray-600">Loading...</span></div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Manage Blogs</h1>
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
        <input
          type="text"
          placeholder="Search by store name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
        >
          <option value="" className="text-gray-900">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id} className="text-gray-900">{cat.name}</option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as any)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
        >
          <option value="all">All Visibility (All)</option>
          <option value="published">Visible Only (ON)</option>
          <option value="draft">Hidden Only (OFF)</option>
        </select>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <span className="text-lg text-gray-600">Loading blogs...</span>
        </div>
      ) : blogs && blogs.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <span className="text-lg text-gray-600">No blogs found.</span>
        </div>
      ) : (
        <ul className="space-y-4">
          {blogs.map((blog) => (
            <li
              key={blog._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:shadow-md"
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                  <span className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                    {decodeRecursively(blog.title)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      blog.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        blog.status === 'published' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                      }`}
                    ></span>
                    {blog.status === 'published' ? 'Visible (ON)' : 'Hidden (OFF)'}
                  </span>
                </div>
                <div className="text-gray-600 text-xs sm:text-sm flex items-center gap-3 flex-wrap">
                  <span>Store: <strong className="font-semibold text-gray-800">{blog.store?.name || "-"}</strong></span>
                  {blog.createdAt && (
                    <span className="text-gray-400">
                      • Added: {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Unified height and size, perfectly aligned */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Show / Hide Toggle Button */}
                <button
                  type="button"
                  disabled={togglingId === blog._id}
                  onClick={() => handleToggleStatus(blog)}
                  className={`h-9 px-3.5 rounded-lg text-xs font-semibold transition-all border shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap ${
                    blog.status === 'published'
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                  title={blog.status === 'published' ? 'Click to Turn Off (Hide from website)' : 'Click to Turn On (Show on website)'}
                >
                  {togglingId === blog._id ? (
                    'Updating...'
                  ) : blog.status === 'published' ? (
                    <>
                      <span className="text-sm leading-none">👁️‍🗨️</span> Turn Off (Hide)
                    </>
                  ) : (
                    <>
                      <span className="text-sm leading-none">👁️</span> Turn On (Show)
                    </>
                  )}
                </button>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => handleEdit(blog._id)}
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>✏️</span> Edit
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDelete(blog._id)}
                  className="h-9 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>🗑️</span> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-center mt-6 gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 rounded bg-gray-200"
        >
          Prev
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1 rounded bg-gray-200"
        >
          Next
        </button>
      </div>
    </div>
  );
}