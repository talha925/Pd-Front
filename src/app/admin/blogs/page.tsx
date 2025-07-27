"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from '@/context/AuthContext';

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
  store: {
    id: string;
    name: string;
  };
}

interface Category {
  _id: string;
  name: string;
}

export default function AdminBlogsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-40"><span className="text-lg text-gray-600">Loading...</span></div>;
  }
  if (!isAuthenticated) {
    return null;
  }

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch categories
  useEffect(() => {
    api.get("/api/blog-categories").then((data) => {
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
    params.append('page', String(page));
    params.append('pageSize', String(pageSize));

    api.get(`/api/blogs?${params.toString()}`)
      .then((response) => {
        const { blogs, success } = response;
        if (success && blogs && Array.isArray(blogs.blogs)) {
          setBlogs(blogs.blogs);
          setTotalPages((blogs.pagination && blogs.pagination.pages) || 1);
        } else {
          setBlogs([]);
          setTotalPages(1);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedSearchTerm, selectedCategory, selectedDate, page]);

  // Delete blog handler
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Are you sure you want to delete this blog?")) return;
      try {
        await api.delete(`/api/blogs/${id}`);
        setBlogs((prev) => prev.filter((blog) => blog._id !== id));
      } catch (err) {
        alert("Failed to delete blog. Please try again.");
      }
    },
    []
  );

  // Edit blog handler
  const handleEdit = useCallback((id: string) => {
    router.push(`/admin/blogs/${id}/edit`);
  }, [router]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Manage Blogs</h1>
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Search by store name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 px-4 py-3 border border-gray-300 rounded-lg"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg"
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
              className="bg-white rounded-xl shadow p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="text-lg font-semibold text-gray-900">{blog.title}</div>
                <div className="text-gray-600 text-sm mt-1">
                  Store: <span className="font-medium">{blog.store?.name || "-"}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-2 sm:mt-0">
                <button
                  onClick={() => handleEdit(blog._id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(blog._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Delete
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