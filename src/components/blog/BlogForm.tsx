'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HttpClient from '@/services/HttpClient';
import Image from 'next/image';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import config from '@/lib/config';
import {
  FormField,
  CategorySelector,
  StoreSelector,
  FAQSection,
  SEOMetadataSection
} from './index';
import OptimizedRichTextEditor from '@/components/ui/OptimizedRichTextEditor';
import { Category, Store, BlogValidationErrors } from '@/lib/types';
import {
  isValidUrl,
  isValidEmail,
  stripHtml,
  sanitizeHtml,
  cleanAndFormatUrl
} from '@/lib/utils/validation';
import { processTags, decodeRecursively } from '@/lib/utils/formatting';
import { BLOG_STATUS_OPTIONS } from '@/lib/constants/options';
import BlogInteractive from '@/components/blog/BlogInteractive';

interface BlogFormProps {
  initialValues?: Partial<{
    _id: string;
    title: string;
    shortDescription: string;
    longDescription: string;
    categoryId: string;
    storeId: string;
    storeUrl: string;
    authorName: string;
    authorEmail: string;
    authorAvatar: string;
    status: string;
    isFeatured: boolean;
    imageUrl: string;
    imageAlt: string;
    tags: string;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    metaCanonicalUrl: string;
    metaRobots: string;
    faqs: Array<{ question: string; answer: string }>;
    frontBanner: boolean;
  }>;
  onSubmit?: (data: any, resetForm: () => void, setLoading: (b: boolean) => void, setMessage: (msg: string) => void, setErrors: (e: any) => void) => Promise<void>;
  submitLabel?: string;
  loadingOverride?: boolean;
}

const BlogForm = ({ initialValues, onSubmit, submitLabel, loadingOverride }: BlogFormProps = {}) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, token } = useUnifiedAuth();
  const httpClient = new HttpClient();

  // Required Fields
  const [title, setTitle] = useState(initialValues?.title || '');
  const [shortDescription, setShortDescription] = useState(initialValues?.shortDescription || '');
  const [longDescription, setLongDescription] = useState(decodeRecursively(initialValues?.longDescription || ''));
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId || '');
  const [storeId, setStoreId] = useState(initialValues?.storeId || '');
  const [storeUrl, setStoreUrl] = useState(initialValues?.storeUrl || '');
  const [authorName, setAuthorName] = useState(initialValues?.authorName || '');
  const [status, setStatus] = useState(initialValues?.status || 'published');

  // Optional Fields
  const [authorEmail, setAuthorEmail] = useState(initialValues?.authorEmail || '');
  const [authorAvatar, setAuthorAvatar] = useState(initialValues?.authorAvatar || '');
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl || '');
  const [imageAlt, setImageAlt] = useState(initialValues?.imageAlt || '');
  const [isFeatured, setIsFeatured] = useState(initialValues?.isFeatured || false);
  const [frontBanner, setFrontBanner] = useState(initialValues?.frontBanner || false);
  const [tags, setTags] = useState(initialValues?.tags || '');

  // Image Upload States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploadMessage, setImageUploadMessage] = useState('');

  // SEO Metadata Fields
  const [metaTitle, setMetaTitle] = useState(initialValues?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialValues?.metaDescription || '');
  const [metaKeywords, setMetaKeywords] = useState(initialValues?.metaKeywords || '');
  const [metaCanonicalUrl, setMetaCanonicalUrl] = useState(initialValues?.metaCanonicalUrl || '');
  const [metaRobots, setMetaRobots] = useState(initialValues?.metaRobots || 'index,follow');

  // FAQs Section (only declare once, with initialValues support)
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(initialValues?.faqs || []);

  // Form State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [storesLoading, setStoresLoading] = useState(true);

  // Validation States
  const [errors, setErrors] = useState<BlogValidationErrors>({});

  // Preview Mode for Long Description
  const [longDescTab, setLongDescTab] = useState<'editor' | 'raw' | 'preview'>('editor');
  const [showFullPreviewModal, setShowFullPreviewModal] = useState(false);

  // Image Upload Handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImageUploadMessage('');
    }
  };

  // Fetch Blog Categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const data = await httpClient.get('/api/blog-categories');
        setCategories(data.data || data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch Stores from API
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setStoresLoading(true);
        const data = await httpClient.get('/api/proxy-stores');
        const storesData = data.data || data || [];
        setStores(storesData);
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setStoresLoading(false);
      }
    };

    fetchStores();
  }, []);

  const handleStoreChange = (selectedStoreId: string, selectedStoreUrl: string) => {
    setStoreId(selectedStoreId);
    setStoreUrl(selectedStoreUrl);
  };

  const handleMetaChange = (field: string, value: string) => {
    switch (field) {
      case 'metaTitle':
        setMetaTitle(value);
        break;
      case 'metaDescription':
        setMetaDescription(value);
        break;
      case 'metaKeywords':
        setMetaKeywords(value);
        break;
      case 'metaCanonicalUrl':
        setMetaCanonicalUrl(value);
        break;
      case 'metaRobots':
        setMetaRobots(value);
        break;
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors: BlogValidationErrors = {};

    // Required field validations
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    }

    if (!shortDescription.trim()) {
      newErrors.shortDescription = 'Short description is required';
    } else if (shortDescription.trim().length < 10) {
      newErrors.shortDescription = 'Short description must be at least 10 characters long';
    } else if (shortDescription.trim().length > 500) {
      newErrors.shortDescription = 'Short description must not exceed 500 characters';
    }

    const plainLongDescription = stripHtml(longDescription);

    if (!plainLongDescription.trim()) {
      newErrors.longDescription = 'Long description is required';
    } else if (plainLongDescription.trim().length < 50) {
      newErrors.longDescription = 'Long description must be at least 50 characters long';
    }

    if (!categoryId) {
      newErrors.category = 'Category is required';
    }

    if (!storeId) {
      newErrors.store = 'Store is required';
    } else if (!storeUrl) {
      newErrors.store = 'Selected store must have a valid URL';
    }

    if (!authorName.trim()) {
      newErrors.authorName = 'Author name is required';
    }

    // Optional field validations
    if (authorEmail && !isValidEmail(authorEmail)) {
      newErrors.authorEmail = 'Please enter a valid email address';
    }

    if (authorAvatar && !isValidUrl(authorAvatar)) {
      newErrors.authorAvatar = 'Please enter a valid URL';
    }

    if (imageUrl && !isValidUrl(imageUrl)) {
      newErrors.imageUrl = 'Please enter a valid URL';
    }

    // SEO metadata validations
    if (metaTitle && metaTitle.length > 60) {
      newErrors.metaTitle = 'Meta title should not exceed 60 characters';
    }

    if (metaDescription && metaDescription.length > 160) {
      newErrors.metaDescription = 'Meta description should not exceed 160 characters';
    }

    if (metaCanonicalUrl && !isValidUrl(metaCanonicalUrl)) {
      newErrors.metaCanonicalUrl = 'Please enter a valid canonical URL';
    }

    // FAQ validations
    faqs.forEach((faq, index) => {
      if (!faq.question.trim()) {
        newErrors[`faqQuestion${index}`] = 'FAQ question is required';
      }
      if (!faq.answer.trim()) {
        newErrors[`faqAnswer${index}`] = 'FAQ answer is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage('Please fix the errors above before submitting.');
      return;
    }

    setLoading(true);
    setMessage('');

    // Find the selected category and store objects
    const selectedCategory = categories.find(cat => cat._id === categoryId);
    const selectedStore = stores.find(store => store._id === storeId);

    if (!selectedCategory || !selectedStore) {
      setMessage('Invalid category or store selection.');
      setLoading(false);
      return;
    }

    // Clean the URL before validation to ensure it's properly formatted
    const cleanUrl = cleanAndFormatUrl(storeUrl);

    // Additional URL validation
    try {
      new URL(cleanUrl);
    } catch (error) {
      setMessage('Invalid store URL format. Please check the URL and try again.');
      setLoading(false);
      return;
    }

    // Handle image upload if there's a selected file but no imageUrl
    let finalImageUrl = imageUrl;
    if (imageFile && !imageUrl.trim()) {
      try {
        setMessage('Uploading image...');
        const formData = new FormData();
        formData.append('file', imageFile);

        const uploadResponse = await fetch(`/api/upload`, {
          method: 'POST',
          body: formData,
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Image upload failed: ${uploadResponse.status}`);
        }

        const uploadData = await uploadResponse.json();
        finalImageUrl = uploadData.imageUrl;
        setImageUrl(uploadData.imageUrl); // Update state with uploaded URL
        setImageFile(null); // Clear the file input
        setMessage('Image uploaded successfully! Proceeding with blog creation...');
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        setMessage('Failed to upload image. Please try uploading the image again or provide an image URL.');
        setLoading(false);
        return;
      }
    }

    // Process tags
    const processedTags = processTags(tags);

    // Sanitize the HTML content from TinyMCE
    const sanitizedLongDescription = sanitizeHtml(longDescription);

    // Build the blog data object
    const blogData = {
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      longDescription: sanitizedLongDescription,
      author: {
        name: authorName.trim(),
        email: authorEmail.trim() || undefined,
        avatar: authorAvatar.trim() || undefined,
      },
      category: {
        id: selectedCategory._id,
        name: selectedCategory.name,
        slug: selectedCategory.name.toLowerCase().replace(/\s+/g, '-'),
      },
      store: {
        id: selectedStore._id,
        name: selectedStore.name,
        url: cleanUrl,
      },
      status,
      isFeaturedForHome: isFeatured,
      FrontBanner: frontBanner,
      // Only include image if we have a valid image URL
      ...(finalImageUrl && finalImageUrl.trim() && {
        image: {
          url: finalImageUrl.trim(),
          alt: imageAlt.trim() || title.trim()
        }
      }),
      tags: processedTags.length > 0 ? processedTags : undefined,
      // SEO Metadata
      meta: {
        title: metaTitle.trim() || undefined,
        description: metaDescription.trim() || undefined,
        keywords: typeof metaKeywords === 'string' ? metaKeywords.split(',').map(k => k.trim()).filter(Boolean) : undefined,
        canonicalUrl: metaCanonicalUrl.trim() || undefined,
        robots: metaRobots.trim() || 'index,follow',
      },
      // FAQs
      faqs: faqs.length > 0 ? faqs : undefined,
    };

    if (onSubmit) {
      await onSubmit(blogData, resetForm, setLoading, setMessage, setErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await httpClient.post('/api/create-blog', blogData);
      console.log('Blog creation response:', response);
      setMessage('Blog created successfully!');

      // Clear banner cache if this blog has FrontBanner enabled
      if (frontBanner) {
        localStorage.removeItem('heroBannerData');
        console.log('Banner cache cleared due to FrontBanner blog creation');
      }

      // Reset form after successful save
      resetForm();
      // Redirect to admin blogs page after successful creation
      setTimeout(() => {
        router.push('/admin/blogs');
      }, 1500);
    } catch (error: any) {
      console.error('Error creating blog:', error);

      // Extract more detailed error information
      let errorMessage = 'Error creating blog. Please try again.';

      if (error?.response) {
        // API returned an error response
        errorMessage = error.response.error || error.response.message || errorMessage;
      } else if (error?.message) {
        // Network or other error
        if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timeout. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }

      console.error('Detailed error info:', {
        message: error?.message,
        status: error?.status,
        response: error?.response,
        isNetworkError: error?.isNetworkError,
        isTimeoutError: error?.isTimeoutError
      });

      setMessage(errorMessage);
    }

    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setShortDescription('');
    setLongDescription('');
    setAuthorName('');
    setAuthorEmail('');
    setAuthorAvatar('');
    setCategoryId('');
    setStoreId('');
    setStoreUrl('');
    setStatus('draft');
    setIsFeatured(false);
    setFrontBanner(false);
    setImageUrl('');
    setImageAlt('');
    setTags('');
    setImageFile(null);
    // Reset SEO metadata
    setMetaTitle('');
    setMetaDescription('');
    setMetaKeywords('');
    setMetaCanonicalUrl('');
    setMetaRobots('index,follow');
    // Reset FAQs
    setFaqs([]);
    setErrors({});
    // Clear localStorage draft
    localStorage.removeItem('blogDraft');
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('blogDraft');
      if (saved) setLongDescription(saved);
    } catch (error) {
      console.error('Error loading draft from localStorage:', error);
    }
  }, []);

  // Check if user is authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Create a New Blog Post
      </h1>

      {isLoading || !isAuthenticated ? (
        <div className="flex justify-center items-center h-[60vh]">
          <div className="text-xl">Loading...</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Required Fields Section */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Required Fields</h2>

            <FormField
              id="title"
              label="Title"
              type="text"
              value={title}
              onChange={setTitle}
              placeholder="Enter blog title"
              required
              error={errors.title}
            />

            <FormField
              id="shortDescription"
              label="Short Description (Max 500 characters)"
              type="text"
              value={shortDescription}
              onChange={setShortDescription}
              placeholder="Brief description of the blog post"
              required
              maxLength={500}
              error={errors.shortDescription}
            />

            {/* Long Description with Live Preview Tabs */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Long Description <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setLongDescTab('editor')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                        longDescTab === 'editor'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span>✏️</span> Visual Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setLongDescTab('raw')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                        longDescTab === 'raw'
                          ? 'bg-white text-amber-700 shadow-sm font-bold'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span>&lt;/&gt;</span> Raw HTML / Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setLongDescTab('preview')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                        longDescTab === 'preview'
                          ? 'bg-white text-blue-600 shadow-sm font-bold'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span>👁️</span> Live Preview
                    </button>
                  </div>
                  {longDescription && (
                    <button
                      type="button"
                      onClick={() => setShowFullPreviewModal(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition shadow-sm"
                      title="Open Fullscreen Preview Modal"
                    >
                      <span>⛶</span> Full Preview
                    </button>
                  )}
                </div>
              </div>

              {/* Visual Editor View */}
              <div className={longDescTab === 'editor' ? 'block' : 'hidden'}>
                <OptimizedRichTextEditor
                  id="longDescription"
                  value={longDescription}
                  onChange={(content) => setLongDescription(content)}
                  error={errors.longDescription}
                  placeholder="Write your detailed blog content here..."
                  required
                  mode="advanced"
                />
              </div>

              {/* Raw HTML / Code View */}
              {longDescTab === 'raw' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs bg-slate-100 px-3.5 py-2 rounded-t-lg border border-b-0 border-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">&lt;/&gt; Raw HTML Editor</span>
                      <span className="text-slate-500 text-[11px]">(Direct clean paste - will not strip &lt;style&gt;, &lt;script&gt; or format)</span>
                    </div>
                    <span className="font-mono text-slate-500 text-[11px]">{longDescription.length} characters</span>
                  </div>
                  <textarea
                    id="rawLongDescription"
                    value={longDescription}
                    onChange={(e) => setLongDescription(e.target.value)}
                    rows={22}
                    className="w-full font-mono text-xs p-4 bg-slate-950 text-emerald-400 border border-slate-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                    placeholder="Paste your raw HTML here (e.g. <style>...</style><div class='mgx-wrap'>...</div>)"
                  />
                </div>
              )}

              {/* Live Preview View */}
              {longDescTab === 'preview' && (
                <div className="border border-slate-200 rounded-xl p-6 sm:p-8 bg-white shadow-sm min-h-[450px]">
                  <div className="flex items-center justify-between pb-3 mb-6 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Interactive Live Preview (Exact Website Styles)
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLongDescTab('raw')}
                        className="text-xs px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md font-medium transition"
                      >
                        Edit Raw HTML
                      </button>
                      <button
                        type="button"
                        onClick={() => setLongDescTab('editor')}
                        className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition"
                      >
                        Visual Editor
                      </button>
                    </div>
                  </div>
                  {longDescription ? (
                    (() => {
                      const decoded = decodeRecursively(longDescription);
                      const isMgx = decoded.includes('mgx-wrap') || decoded.includes('mgx-hero');
                      return (
                        <>
                          <BlogInteractive />
                          <article
                            className={`blog-content w-full max-w-none ${
                              isMgx ? '' : 'prose prose-lg md:prose-xl prose-slate'
                            }`}
                            dangerouslySetInnerHTML={{ __html: decoded }}
                          />
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-center py-16">
                      <p className="text-slate-400 italic">No content to preview yet. Switch to "Raw HTML / Code" or "Visual Editor" tab to write or paste your blog.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <CategorySelector
                categories={categories}
                selectedCategoryId={categoryId}
                onCategoryChange={setCategoryId}
                loading={categoriesLoading}
                error={errors.category}
              />

              <StoreSelector
                stores={stores}
                selectedStoreId={storeId}
                onStoreChange={handleStoreChange}
                loading={storesLoading}
                error={errors.store}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <FormField
                id="authorName"
                label="Author Name"
                type="text"
                value={authorName}
                onChange={setAuthorName}
                placeholder="Author name"
                required
                error={errors.authorName}
              />

              {/* Blog Visibility Toggle Switch (Show / Hide Button) */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label htmlFor="blog-visibility-toggle" className="block text-sm font-semibold text-gray-800 cursor-pointer">
                      Show Blog on Website <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {status === 'published'
                        ? 'Blog is ON — Visible to all visitors on the website.'
                        : 'Blog is OFF — Hidden from website visitors.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    id="blog-visibility-toggle"
                    role="switch"
                    aria-checked={status === 'published'}
                    onClick={() => setStatus(status === 'published' ? 'draft' : 'published')}
                    className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                      status === 'published' ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className="sr-only">Toggle Blog Visibility</span>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        status === 'published' ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      status === 'published'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        status === 'published' ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
                      }`}
                    ></span>
                    {status === 'published' ? '🟢 Visible (ON)' : '⚪ Hidden (OFF)'}
                  </span>

                  <button
                    type="button"
                    onClick={() => setStatus(status === 'published' ? 'draft' : 'published')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    Click to {status === 'published' ? 'Turn OFF (Hide)' : 'Turn ON (Show)'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Optional Fields Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Optional Fields</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <FormField
                id="authorEmail"
                label="Author Email"
                type="email"
                value={authorEmail}
                onChange={setAuthorEmail}
                placeholder="author@example.com"
                error={errors.authorEmail}
              />

              <FormField
                id="authorAvatar"
                label="Author Avatar URL"
                type="url"
                value={authorAvatar}
                onChange={setAuthorAvatar}
                placeholder="https://example.com/avatar.jpg"
                error={errors.authorAvatar}
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-4 mb-6">
              <label className="block text-sm font-medium text-gray-700 cursor-pointer">Upload Image (Optional)</label>
              <div className="text-xs text-gray-500 mb-2">
                Select an image file to upload. The image will be uploaded automatically when you submit the blog post.
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />

              {imageFile && (
                <div className="text-sm text-green-600 mt-1">
                  ✓ Selected: {imageFile.name} (will be uploaded when you submit the blog)
                </div>
              )}

              {imageUrl && (
                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">Image Preview:</div>
                  {/* Ensure image URL is encoded for Next.js Image component */}
                  <Image
                    src={imageUrl}
                    alt={imageAlt || 'Uploaded preview'}
                    width={500}
                    height={300}
                    className="rounded-lg w-full max-w-md h-auto object-cover border border-gray-300"
                    unoptimized={true} // For testing purposes, remove in production if not needed
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <FormField
                id="imageUrl"
                label="Image URL (Alternative to upload above)"
                type="url"
                value={imageUrl}
                onChange={setImageUrl}
                placeholder="https://example.com/image.jpg"
                error={errors.imageUrl}
              />

              <FormField
                id="imageAlt"
                label="Image Alt Text"
                type="text"
                value={imageAlt}
                onChange={setImageAlt}
                placeholder="Description of the image"
              />
            </div>

            <FormField
              id="tags"
              label="Tags"
              type="text"
              value={tags}
              onChange={setTags}
              placeholder="Enter tags separated by commas (e.g., technology, web development, tips)"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                <input
                  id="isFeatured"
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isFeatured" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                  Featured for Home
                </label>
              </div>

              <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                <input
                  id="frontBanner"
                  type="checkbox"
                  checked={frontBanner}
                  onChange={(e) => setFrontBanner(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="frontBanner" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                  Front Banner
                </label>
              </div>
            </div>
          </div>

          {/* SEO Metadata Section */}
          <SEOMetadataSection
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            metaKeywords={metaKeywords}
            metaCanonicalUrl={metaCanonicalUrl}
            metaRobots={metaRobots}
            onMetaChange={handleMetaChange}
            errors={errors}
          />

          {/* FAQs Section */}
          <FAQSection
            faqs={faqs}
            onFaqsChange={setFaqs}
            errors={errors}
          />

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-green-600 text-white rounded-lg text-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (submitLabel || 'Create Blog Post')}
            </button>
          </div>

          {message && (
            <div className="mt-6 text-center text-lg text-gray-700">
              {message}
            </div>
          )}
        </form>
      )}

      {/* Fullscreen Preview Modal */}
      {showFullPreviewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex justify-center items-start p-3 sm:p-6 md:p-10 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👁️</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Blog Full Preview</h3>
                  <p className="text-xs text-slate-500">Live preview of how this blog will appear to users on the website</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFullPreviewModal(false)}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition"
              >
                ✕ Close Preview
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-10 overflow-y-auto space-y-6">
              {/* Blog Title */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
                {title || 'Untitled Blog Post'}
              </h1>

              {/* Short Description */}
              {shortDescription && (
                <p className="text-slate-600 text-base md:text-lg italic border-l-4 border-blue-500 pl-4 py-1">
                  {shortDescription}
                </p>
              )}

              {/* Blog Image */}
              {imageUrl && (
                <div className="w-full max-h-[400px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt={imageAlt || title || 'Blog cover'}
                    className="max-h-[400px] w-auto object-contain"
                  />
                </div>
              )}

              {/* Long Description Content */}
              <div className="pt-4 border-t border-slate-100">
                <article 
                  className="blog-content prose prose-lg md:prose-xl prose-slate w-full max-w-none"
                  dangerouslySetInnerHTML={{ __html: decodeRecursively(longDescription) }}
                >
                  <BlogInteractive />
                </article>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFullPreviewModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
              >
                Done Previewing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogForm;