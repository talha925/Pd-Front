'use client';

import { useEffect, useState } from 'react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings?: TOCItem[];
  contentSelector?: string;
}

export default function TableOfContents({ headings: propHeadings, contentSelector = '.blog-content' }: TableOfContentsProps) {
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (propHeadings && propHeadings.length > 0) {
      setToc(propHeadings);
      return;
    }

    const generateTOC = () => {
      const contentElement = document.querySelector(contentSelector);
      if (!contentElement) return;

      const headings = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const tocItems: TOCItem[] = [];

      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        const text = heading.textContent || '';
        let id = heading.id;
        
        // Generate ID if not present
        if (!id) {
          id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
          heading.id = id;
        }
        
        // Add scroll margin for better positioning
        heading.classList.add('scroll-mt-20');
        
        if (text.trim()) {
          tocItems.push({ id, text, level });
        }
      });

      setToc(tocItems);
    };

    // Generate TOC after a short delay to ensure content is rendered
    const timer = setTimeout(generateTOC, 100);
    return () => clearTimeout(timer);
  }, [propHeadings, contentSelector]);

  useEffect(() => {
    const handleScroll = () => {
      const headings = toc.map(item => document.getElementById(item.id)).filter(Boolean);
      
      let currentActiveId = '';
      for (const heading of headings) {
        if (heading) {
          const rect = heading.getBoundingClientRect();
          if (rect.top <= 100) {
            currentActiveId = heading.id;
          } else {
            break;
          }
        }
      }
      
      setActiveId(currentActiveId);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (toc.length === 0) {
    return (
      <aside className="sticky top-24 h-fit">
        <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">📋</span>
            </div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Table of Contents
            </h3>
          </div>
          <div className="text-center py-4">
            <span className="text-sm text-gray-500">No headings found</span>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sticky top-24 h-fit">
      <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white text-sm font-bold">📋</span>
          </div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Table of Contents
          </h3>
        </div>
        
        <nav className="space-y-1 max-h-80 overflow-y-auto">
          {toc.map((item, index) => {
            const isActive = activeId === item.id;
            const paddingLeft = `${(item.level - 1) * 12 + 8}px`;
            
            return (
              <button
                key={index}
                onClick={() => scrollToHeading(item.id)}
                className={`w-full text-left p-2 rounded-lg transition-all duration-300 hover:bg-emerald-50 group ${
                  isActive ? 'bg-emerald-100 border-l-4 border-emerald-500' : ''
                }`}
                style={{ paddingLeft }}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full transition-colors ${
                    item.level === 1 ? 'bg-emerald-600' :
                    item.level === 2 ? 'bg-emerald-500' :
                    item.level === 3 ? 'bg-emerald-400' :
                    'bg-emerald-300'
                  } ${isActive ? 'scale-125' : ''}`}></div>
                  <span className={`text-sm transition-colors line-clamp-2 ${
                    isActive ? 'text-emerald-700 font-semibold' : 'text-gray-700 group-hover:text-emerald-600'
                  } ${
                    item.level === 1 ? 'font-semibold' :
                    item.level === 2 ? 'font-medium' :
                    'font-normal'
                  }`}>
                    {item.text}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}