"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, LogOut, Bell, Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";
import NotificationToast from "@/components/ui/NotificationToast";
import { useState } from "react";

export default function Header() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const { state } = useApp();
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Hide header on all /admin routes
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-gray-900/95 backdrop-blur-md shadow-2xl border-b border-gray-800/50">
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
                  className="w-10 h-10 transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <h1 className="text-2xl md:text-3xl bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent font-bold tracking-tight">
                BRANDWELL
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {[
              ['Home', '/'],
              ['Categories', '/Categories'],
              ['Stores', '/stores'],
              ['Blog', '/blog'],
            ].map(([name, href]) => (
              <Link
                key={name}
                href={href}
                className={`relative px-4 py-2 text-gray-300 hover:text-white transition-all duration-300 group ${pathname === href ? 'text-white' : ''
                  }`}
              >
                <span className="relative z-10 font-medium">{name}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-blue-400 to-purple-600 transition-all duration-300 ${pathname === href ? 'w-full' : 'w-0 group-hover:w-full'
                  }`} />
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors duration-300" />
              <input
                type="text"
                placeholder="Find Coupons & Stores..."
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-gray-800/70"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-300"
            >
              {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>

            {/* Theme Toggle */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* Notification Bell */}
            <button className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-300 group">
              <Bell className="w-5 h-5" />
              {state.notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse font-semibold">
                  {state.notifications.length}
                </span>
              )}
            </button>

            {/* User Menu - Desktop */}
            {isAuthenticated && (
              <div className="hidden lg:flex items-center space-x-3">
                <div className="text-sm text-gray-300">
                  Welcome, <span className="text-white font-medium">{user?.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white hover:bg-gray-800/50 px-3 py-2 rounded-lg transition-all duration-300 group"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-300">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0 bg-gray-900 border-gray-800">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="p-6 border-b border-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl flex items-center justify-center">
                        <Image
                          src="/image/Logo-ATT.png"
                          alt="logo"
                          width={24}
                          height={24}
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
                    <nav className="space-y-2">
                      {[
                        ['Home', '/'],
                        ['Categories', '/Categories'],
                        ['Stores', '/stores'],
                        ['Blog', '/blog'],
                      ].map(([name, href]) => (
                        <Link
                          key={name}
                          href={href}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${pathname === href
                              ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/30'
                              : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                            }`}
                        >
                          <span className="font-medium">{name}</span>
                        </Link>
                      ))}
                    </nav>

                    {/* Mobile User Section */}
                    {isAuthenticated && (
                      <div className="mt-8 pt-6 border-t border-gray-800">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {user?.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-white font-medium">{user?.name}</div>
                            <div className="text-gray-400 text-sm">User Account</div>
                          </div>
                        </div>
                        <button
                          onClick={logout}
                          className="w-full flex items-center justify-center space-x-2 text-gray-300 hover:text-white hover:bg-gray-800/50 px-4 py-3 rounded-xl transition-all duration-300"
                        >
                          <LogOut className="w-4 h-4" />
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Find Coupons & Stores..."
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* Notification Toast */}
      <NotificationToast />
    </header>
  );
}
