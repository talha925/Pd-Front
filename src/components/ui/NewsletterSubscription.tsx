'use client';

import { useState } from 'react';
import { themeClasses } from '@/lib/theme/utils';

export default function NewsletterSubscription() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }
    
    setStatus('loading');
    
    try {
      // Here you would typically send the email to your API
      // For now, we'll just simulate a successful subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus('success');
      setMessage('Thank you for subscribing!');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage('Failed to subscribe. Please try again.');
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
        Subscribe to Our Newsletter
      </h3>
      <p className="text-gray-400 mb-6 text-lg leading-relaxed">Stay updated with our latest deals and articles</p>
      
      {status === 'success' ? (
        <div className="px-4 py-3 rounded-xl bg-green-900/30 border border-green-700 text-green-400">
          {message}
        </div>
      ) : (
        <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className={`flex-1 px-4 py-3 rounded-xl ${themeClasses.backgrounds.card} ${themeClasses.borders.light} focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-gray-900 placeholder-gray-500 transition-all duration-300`}
            disabled={status === 'loading'}
          />
          <button 
            type="submit"
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
      )}
      
      {status === 'error' && (
        <div className="mt-2 text-red-400 text-sm">
          {message}
        </div>
      )}
    </div>
  );
}