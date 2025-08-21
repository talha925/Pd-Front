"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, LogOut, Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useApp } from "@/context/AppContext";
import { usePathname } from "next/navigation";
import { useBlogCategories } from "@/hooks/useBlogCategories";

import NotificationToast from "@/components/ui/NotificationToast";
import SearchBar from "@/components/ui/SearchBar";
import { useState, useEffect } from "react";
import { themeClasses } from "@/lib/theme/utils";

export default function Header() {
  const { user, isAuthenticated, logout, isLoading } = useUnifiedAuth();
  const { state } = useApp();
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { categories, loading: categoriesLoading } = useBlogCategories();

  // Static nav items
  const staticNavItems = [
    ['Home', '/'],
    ['Blog', '/blog'],
  ];

  // Combine static nav items with dynamic blog categories
  const navItems = [
    ...staticNavItems,
    ...(Array.isArray(categories) ? categories.map(category => [
      category.name,
      `/blog/category/${category.slug}`
    ]) : [])
  ];

  // Prevent hydration mismatch by only showing dynamic content after hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Hide header on all /admin routes
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background-elevated/95 backdrop-blur-md shadow-2xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative overflow-hidden rounded-xl p-2 bg-gradient-to-br from-blue-600/20 to-purple-600/20 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-300">
                <Image
                  src="/image/Logo-ATT.png"
                  alt="logo"
                  width={40}
                  height={40}
                  priority
                  className="w-10 h-10 transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <h1 className="text-2xl md:text-3xl bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent font-bold tracking-tight">
                BRANDWELL
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            {/* Static Navigation Items */}
            {staticNavItems.map(([name, href]) => (
              <Link
                key={name}
                href={href}
                className={`relative px-4 py-2 text-foreground-secondary hover:text-foreground transition-all duration-300 group ${
                  pathname === href ? 'text-foreground' : ''
                }`}
              >
                <span className="relative z-10 font-medium">{name}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-blue-400 to-purple-600 transition-all duration-300 ${
                  pathname === href ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </Link>
            ))}
            
            {/* Categories Dropdown */}
            {Array.isArray(categories) && categories.length > 0 && (
              <div className="relative group">
                <button 
                  className="relative px-4 py-2 text-foreground-secondary hover:text-foreground transition-all duration-300 group flex items-center space-x-1"
                  aria-expanded="false"
                  aria-haspopup="true"
                  aria-label="Blog categories menu"
                >
                  <span className="relative z-10 font-medium">Categories</span>
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
                
                {/* Dropdown Menu */}
                <div 
                  className="absolute top-full left-0 mt-2 w-64 bg-background-elevated/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50"
                  role="menu"
                  aria-label="Blog categories"
                >
                  <div className="p-2">
                    {categories.map((category) => (
                      <Link
                        key={category._id}
                        href={`/blog/category/${category.slug}`}
                        className="block px-4 py-3 text-foreground-secondary hover:text-foreground hover:bg-gradient-to-r hover:from-button-blue/20 hover:to-primary/20 rounded-lg transition-all duration-300 group/item focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background-elevated"
                        role="menuitem"
                        aria-label={`View ${category.name} blog posts`}
                      >
                        <span className="font-medium">{category.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <SearchBar className="w-full" />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-foreground-tertiary hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-300"
            >
              {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>





            {/* User Menu - Desktop */}
            {isHydrated && isAuthenticated && (
              <div className="hidden lg:flex items-center space-x-3">
                <div className="text-sm text-foreground-secondary">
                  Welcome, <span className="text-foreground font-medium">{user?.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 text-foreground-tertiary hover:text-foreground hover:bg-accent/50 px-3 py-2 rounded-lg transition-all duration-300 group"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="lg:hidden p-2 text-foreground-tertiary hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-300">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0 bg-background-elevated border-border">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl flex items-center justify-center">
                        <Image
                          src="/image/Logo-ATT.png"
                          alt="logo"
                          width={24}
                          height={24}
                          priority
                          className="w-6 h-6"
                        />
                      </div>
                      <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                        BRANDWELL
                      </h2>
                    </div>
                  </div>

                  {/* Mobile Navigation */}
                  <div className="flex-1 p-6">
                    <nav className="space-y-2" role="navigation" aria-label="Mobile navigation menu">
                      {navItems.map(([name, href]) => (
                        <Link
                          key={name}
                          href={href}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background-elevated ${pathname === href
                              ? 'bg-gradient-to-r from-button-blue/20 to-primary/20 text-foreground border border-primary/30'
                              : 'text-foreground-secondary hover:text-foreground hover:bg-accent/50'
                            }`}
                          aria-current={pathname === href ? 'page' : undefined}
                        >
                          <span className="font-medium">{name}</span>
                        </Link>
                      ))}
                    </nav>

                    {/* Mobile User Section */}
                    {isHydrated && isAuthenticated && (
                      <div className={`mt-8 pt-6 border-t ${themeClasses.borders.light}`}>
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center">
                            <span className={`${themeClasses.text.inverse} font-semibold text-sm`}>
                              {user?.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className={`${themeClasses.text.primary} font-medium`}>{user?.name}</div>
                            <div className={`${themeClasses.text.secondary} text-sm`}>User Account</div>
                          </div>
                        </div>
                        <button
                          onClick={logout}
                          className={`w-full flex items-center justify-center space-x-2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary} hover:${themeClasses.backgrounds.secondary} px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
                          aria-label="Logout from your account"
                        >
                          <LogOut className="w-4 h-4" aria-hidden="true" />
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden py-4 border-t border-gray-800/50">
            <SearchBar 
              className="w-full" 
              isMobile={true} 
              onClose={() => setIsSearchOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Notification Toast */}
      <NotificationToast />
    </header>
  );
}
