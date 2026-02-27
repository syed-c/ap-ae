'use client'

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

/**
 * LazyImage component that uses native lazy loading and Intersection Observer
 * for optimal performance. Images load only when they enter the viewport.
 */
export function LazyImage({ 
  src, 
  alt, 
  className, 
  width, 
  height, 
  priority = false 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Optimize Unsplash images with quality and size parameters
  const optimizedSrc = src.includes('unsplash.com') 
    ? `${src.split('?')[0]}?auto=format&fit=crop&q=75&w=${width || 400}`
    : src;

  return (
    <img
      ref={imgRef}
      src={isInView ? optimizedSrc : undefined}
      data-src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setIsLoaded(true)}
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
        className
      )}
    />
  );
}
