'use client';

import { useEffect } from 'react';

/**
 * Handles client-side interactivity for blog content:
 * 1. Before/After graphic comparison slider (.mgx-range -> --mgx-pos)
 * 2. Sensitive content reveal toggle ([data-mgx-reveal] -> .revealed)
 * 3. Track scrolling arrows for comparison galleries
 */
export default function BlogInteractive() {
  useEffect(() => {
    // 1. Slider input handling for before/after comparison frames
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target && target.matches('.mgx-range, [data-mgx-range]')) {
        const frame = target.closest('.mgx-comparison-frame') as HTMLElement;
        if (frame) {
          frame.style.setProperty('--mgx-pos', `${target.value}%`);
        }
      }
    };

    // 2. Click handling for reveal buttons and arrows
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Sensitive content reveal button
      const revealBtn = target.closest('[data-mgx-reveal], .mgx-reveal button') as HTMLElement;
      if (revealBtn) {
        e.preventDefault();
        const frame = revealBtn.closest('.mgx-comparison-frame') as HTMLElement;
        if (frame) {
          frame.classList.add('revealed');
        }
        return;
      }

      // Track arrows if present
      const prevBtn = target.closest('[data-mgx-prev], .mgx-results-arrow-prev') as HTMLElement;
      if (prevBtn) {
        e.preventDefault();
        const wrap = prevBtn.closest('.mgx-results-track-wrap');
        const track = wrap?.querySelector('.mgx-results-track') as HTMLElement;
        if (track) {
          track.scrollBy({ left: -320, behavior: 'smooth' });
        }
        return;
      }

      const nextBtn = target.closest('[data-mgx-next], .mgx-results-arrow-next') as HTMLElement;
      if (nextBtn) {
        e.preventDefault();
        const wrap = nextBtn.closest('.mgx-results-track-wrap');
        const track = wrap?.querySelector('.mgx-results-track') as HTMLElement;
        if (track) {
          track.scrollBy({ left: 320, behavior: 'smooth' });
        }
        return;
      }
    };

    // Initialize all comparison frames with default 50%
    const initFrames = () => {
      const frames = document.querySelectorAll('.mgx-comparison-frame');
      frames.forEach((frame) => {
        const range = frame.querySelector('.mgx-range, [data-mgx-range]') as HTMLInputElement;
        const defaultVal = range?.value || '50';
        (frame as HTMLElement).style.setProperty('--mgx-pos', `${defaultVal}%`);
      });
    };

    initFrames();
    document.addEventListener('input', handleInput);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('input', handleInput);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return null;
}
