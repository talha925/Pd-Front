import React from 'react';

interface SidebarCardProps {
    title: string;
    icon: string;
    children: React.ReactNode;
    className?: string;
}

export default function SidebarCard({ title, icon, children, className = '' }: SidebarCardProps) {
    return (
        <aside className={`sticky top-24 h-fit ${className}`}>
            <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-sm p-4">
                <div className="flex items-center mb-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="text-white text-xs font-bold">{icon}</span>
                    </div>
                    <h3 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                        {title}
                    </h3>
                </div>
                {children}
            </div>
        </aside>
    );
}
