'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface CarouselProps {
  images: string[];
}

export default function Carousel({ images }: CarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative h-full">
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-800/80 hover:bg-gray-700/90 text-white w-12 h-12 rounded-full cursor-pointer z-10 flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-gray-600/50 hover:border-purple-500/50"
      >
        ❮
      </button>
      <div className="h-full">
        <div className="relative h-full transition-opacity duration-500">
          <Image
            src={images[currentSlide]}
            alt="Current Image"
            width={1920}
            height={1080}
            className="w-full h-full object-cover"
            priority
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-gray-900/50"></div>
        </div>
      </div>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-800/80 hover:bg-gray-700/90 text-white w-12 h-12 rounded-full cursor-pointer z-10 flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-gray-600/50 hover:border-purple-500/50"
      >
        ❯
      </button>
    </div>
  );
}