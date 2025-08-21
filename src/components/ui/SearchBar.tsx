"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Loader2, Store as StoreIcon, FileText } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearch } from '@/hooks/useSearch';
import { cn } from '@/lib/utils';
import { themeClasses, componentThemes } from '@/lib/theme/utils';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

const SearchBar = React.memo(function SearchBar({ 
  className, 
  placeholder, 
  isMobile = false, 
  onClose 
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    query, 
    results, 
    searchType, 
    isSearching, 
    hasResults, 
    updateQuery, 
    clearSearch 
  } = useSearch({ debounceMs: 300, minQueryLength: 2, limit: 8 });

  // Prevent hydration mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Auto-focus for mobile
  useEffect(() => {
    if (isMobile && inputRef.current && isHydrated) {
      inputRef.current.focus();
    }
  }, [isMobile, isHydrated]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateQuery(value);
    setIsOpen(value.length >= 2);
  }, [updateQuery]);

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
    if (query.length >= 2) {
      setIsOpen(true);
    }
  }, [query.length]);

  const handleInputBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Only blur if not clicking on dropdown or clear button
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && containerRef.current?.contains(relatedTarget)) {
      return;
    }
    
    // Delay blur to allow for dropdown interactions
    setTimeout(() => {
      setIsFocused(false);
      setIsOpen(false);
    }, 150);
  }, []);

  const handleClear = useCallback(() => {
    clearSearch();
    setIsOpen(false);
    // Maintain focus on input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
    if (onClose) {
      onClose();
    }
  }, [clearSearch, onClose]);

  const handleResultClick = useCallback(() => {
    setIsOpen(false);
    setIsFocused(false);
    if (isMobile && onClose) {
      onClose();
    }
  }, [isMobile, onClose]);

  const placeholderText = useMemo(() => {
    if (placeholder) return placeholder;
    return searchType === 'stores' 
      ? 'Search stores and coupons...' 
      : 'Search blog articles...';
  }, [placeholder, searchType]);

  const hasCurrentResults = useMemo(() => {
    if (searchType === 'stores') {
      return (results.stores?.length ?? 0) > 0;
    }
    return (results.blogs?.length ?? 0) > 0;
  }, [searchType, results.stores, results.blogs]);

  const renderStoreResults = useMemo(() => {
    if (!results.stores?.length) return null;

    return (
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-medium text-foreground-tertiary uppercase tracking-wide border-b border-border/50">
          <StoreIcon className="w-3 h-3 inline mr-1" />
          Stores ({results.total})
        </div>
        {results.stores.map((store) => (
          <Link
            key={store._id}
            href={`/store/${store._id}`}
            onClick={handleResultClick}
            className="flex items-center space-x-3 px-3 py-3 hover:bg-accent/50 transition-colors duration-200 group"
          >
            {store.image?.url ? (
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={store.image.url}
                  alt={store.image.alt || store.name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-button-blue/20 to-primary/20 flex items-center justify-center flex-shrink-0">
                <StoreIcon className="w-4 h-4 text-button-blue" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-foreground font-medium group-hover:text-button-blue transition-colors truncate">
                {store.name}
              </div>
              {store.heading && (
                <div className="text-sm text-foreground-secondary truncate">
                  {store.heading}
                </div>
              )}
            </div>
            {store.coupons && store.coupons.length > 0 && (
              <div className="text-xs text-button-blue font-medium">
                {store.coupons.length} coupons
              </div>
            )}
          </Link>
        ))}
      </div>
    );
  }, [results.stores, results.total, handleResultClick]);

  const renderBlogResults = useMemo(() => {
    if (!results.blogs?.length) return null;

    return (
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-medium text-foreground-tertiary uppercase tracking-wide border-b border-border/50">
          <FileText className="w-3 h-3 inline mr-1" />
          Articles ({results.total})
        </div>
        {results.blogs.map((blog) => (
          <Link
            key={blog._id}
            href={`/blog/${blog.slug || blog._id}`}
            onClick={handleResultClick}
            className="flex items-start space-x-3 px-3 py-3 hover:bg-accent/50 transition-colors duration-200 group"
          >
            {blog.image?.url ? (
              <div className="w-12 h-8 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={blog.image.url}
                  alt={blog.image.alt || blog.title}
                  width={48}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-8 rounded-lg bg-gradient-to-br from-button-green/20 to-button-blue/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-button-green" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-foreground font-medium group-hover:text-button-blue transition-colors line-clamp-1">
                {blog.title}
              </div>
              <div className="text-sm text-foreground-secondary line-clamp-2 mt-1">
                {blog.shortDescription}
              </div>
              <div className="flex items-center space-x-2 mt-2 text-xs text-foreground-tertiary">
                <span>{blog.category.name}</span>
                <span>•</span>
                <span>{blog.author.name}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  }, [results.blogs, results.total, handleResultClick]);

  // Don't render until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return (
      <div className={cn("relative", className)}>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground-muted" />
          <input
            type="text"
            disabled
            placeholder="Search..."
            value=""
            className={cn(
              "w-full pl-10 pr-10 py-3 bg-background-secondary border border-border rounded-xl text-foreground placeholder-foreground-muted",
              "transition-all duration-300"
            )}
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative group">
        <Search className={cn(
          "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300",
          isFocused ? "text-button-blue" : "text-foreground-muted group-hover:text-button-blue"
        )} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholderText}
          disabled={!isHydrated}
          className={cn(
            "w-full pl-10 pr-10 py-3 bg-background-secondary border border-border rounded-xl text-foreground placeholder-foreground-muted",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus",
            "transition-all duration-300 hover:bg-background-tertiary",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isFocused && "ring-2 ring-ring border-input-focus"
          )}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            onMouseDown={(e) => e.preventDefault()} // Prevent input blur
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-foreground-muted hover:text-foreground transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-button-blue animate-spin" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-button-blue/10 to-primary/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background-elevated/95 backdrop-blur-md border border-border rounded-xl shadow-theme-xl z-50 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-button-blue animate-spin mr-2" />
              <span className="text-foreground-secondary">Searching...</span>
            </div>
          ) : hasCurrentResults ? (
            <div>
              {searchType === 'stores' ? renderStoreResults : renderBlogResults}
            </div>
          ) : query.length >= 2 ? (
            <div className="flex flex-col items-center justify-center py-8 text-foreground-secondary">
              <Search className="w-8 h-8 mb-2 opacity-50" />
              <span>No {searchType} found for "{query}"</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
});

export default SearchBar;