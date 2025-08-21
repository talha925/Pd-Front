'use client';

import NewsletterSubscription from '@/components/ui/NewsletterSubscription';
import { themeClasses } from '@/lib/theme/utils';

export default function Footer() {
  return (
    <footer className={`${themeClasses.backgrounds.tertiary} ${themeClasses.text.primary} py-16 w-full border-t ${themeClasses.borders.light}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Newsletter Signup */}
          <div className="lg:col-span-2">
            <NewsletterSubscription />
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={`text-lg font-semibold mb-6 ${themeClasses.text.primary}`}>Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="#" className={`${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-all duration-300`}>About Us</a></li>
              <li><a href="#" className={`${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-all duration-300`}>Privacy Policy</a></li>
              <li><a href="#" className={`${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-all duration-300`}>Terms & Conditions</a></li>
              <li><a href="#" className={`${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-all duration-300`}>Contact Us</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className={`text-lg font-semibold mb-6 ${themeClasses.text.primary}`}>Categories</h4>
            <ul className="space-y-3">
              <li><a href="#" className={`${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-all duration-300`}>Travel</a></li>
              <li><a href="#" className={`${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-all duration-300`}>Health</a></li>
              <li><a href="#" className={`${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-all duration-300`}>Lifestyle</a></li>
              <li><a href="#" className={`${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-all duration-300`}>Technology</a></li>
            </ul>
          </div>
        </div>

        {/* Copyright text at bottom */}
        <div className="mt-12 text-center">
          <hr className={`border-t ${themeClasses.borders.light} mb-6`} />
          <p className={`${themeClasses.text.secondary} text-lg`}>
            2024 Bloggydeals. We may earn a commission if you use our links/coupons.
          </p>
        </div>
      </div>
    </footer>
  );
}