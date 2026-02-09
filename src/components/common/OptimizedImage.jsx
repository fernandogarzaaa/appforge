/**
 * OptimizedImage Component
 * Automatically handles WebP format with fallback, lazy loading, and responsive images
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * OptimizedImage with WebP support and lazy loading
 *
 * @param {Object} props
 * @param {string} props.src - Image source (will try .webp first)
 * @param {string} props.alt - Alt text for accessibility
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.lazy=true] - Enable lazy loading
 * @param {string} [props.sizes] - Sizes attribute for responsive images
 * @param {string} [props.srcSet] - SrcSet for responsive images
 * @param {Function} [props.onLoad] - Callback when image loads
 * @param {Function} [props.onError] - Callback when image fails to load
 * @param {Object} [props.style] - Inline styles
 */
export function OptimizedImage({
  src,
  alt,
  className,
  lazy = true,
  sizes,
  srcSet,
  onLoad,
  onError,
  style,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  // Generate WebP source
  const webpSrc = src?.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  const hasWebP = webpSrc && webpSrc !== src;

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setHasError(true);
    onError?.(e);
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
              img.src = dataSrc;
              img.removeAttribute('data-src');
            }
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' } // Start loading 50px before entering viewport
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy]);

  if (hasWebP) {
    // Use picture element for WebP with fallback
    return (
      <picture className={cn('block', className)} style={style}>
        <source srcSet={webpSrc} type="image/webp" />
        <img
          ref={imgRef}
          src={lazy ? undefined : src}
          data-src={lazy ? src : undefined}
          alt={alt}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            hasError && 'bg-gray-200'
          )}
          {...props}
        />
      </picture>
    );
  }

  // Standard image without WebP
  return (
    <img
      ref={imgRef}
      src={lazy ? undefined : src}
      data-src={lazy ? src : undefined}
      alt={alt}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
      sizes={sizes}
      srcSet={srcSet}
      onLoad={handleLoad}
      onError={handleError}
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
        hasError && 'bg-gray-200',
        className
      )}
      style={style}
      {...props}
    />
  );
}

/**
 * ResponsiveImage with multiple sizes
 * Automatically generates srcSet for different screen sizes
 *
 * @param {Object} props
 * @param {string} props.src - Base image path (without size suffix)
 * @param {string} props.alt - Alt text
 * @param {Array<number>} [props.breakpoints=[400, 800, 1200]] - Width breakpoints
 * @param {string} [props.className] - CSS classes
 */
export function ResponsiveImage({
  src,
  alt,
  breakpoints = [400, 800, 1200],
  className,
  ...props
}) {
  // Parse filename and extension
  const parsed = src.match(/^(.+?)(\.[^.]+)$/);
  if (!parsed) {
    return <OptimizedImage src={src} alt={alt} className={className} {...props} />;
  }

  const [, basePath, ext] = parsed;

  // Generate srcSet with different sizes
  const srcSet = breakpoints
    .map((width) => `${basePath}-${width}w.webp ${width}w`)
    .join(', ');

  // Generate sizes attribute
  const sizes = `(max-width: 640px) ${breakpoints[0]}px, (max-width: 1024px) ${breakpoints[1]}px, ${breakpoints[2]}px`;

  return (
    <picture className={cn('block', className)}>
      <source srcSet={srcSet} type="image/webp" sizes={sizes} />
      <img
        src={`${basePath}-${breakpoints[1]}w${ext}`}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover"
        {...props}
      />
    </picture>
  );
}

/**
 * LazyImage with Intersection Observer
 * Shows placeholder until image enters viewport
 *
 * @param {Object} props
 * @param {string} props.src - Image source
 * @param {string} props.alt - Alt text
 * @param {string} [props.placeholderClass] - Placeholder color or image
 * @param {string} [props.className] - CSS classes
 */
export function LazyImage({
  src,
  alt,
  placeholderClass = 'bg-gray-200',
  className,
  ...props
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      {!isVisible && (
        <div className={cn('absolute inset-0 animate-pulse', placeholderClass)} />
      )}
      {isVisible && (
        <OptimizedImage
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      )}
    </div>
  );
}

/**
 * ImageWithFallback
 * Shows fallback image or icon if main image fails to load
 *
 * @param {Object} props
 * @param {string} props.src - Main image source
 * @param {string} props.fallbackSrc - Fallback image source
 * @param {string} props.alt - Alt text
 * @param {ReactNode} [props.fallbackIcon] - Fallback icon component
 */
export function ImageWithFallback({
  src,
  fallbackSrc,
  fallbackIcon,
  alt,
  className,
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [showFallback, setShowFallback] = useState(false);

  const handleError = () => {
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    } else {
      setShowFallback(true);
    }
  };

  if (showFallback && fallbackIcon) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-100', className)}>
        {fallbackIcon}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={imgSrc}
      alt={alt}
      onError={handleError}
      className={className}
      {...props}
    />
  );
}

export default OptimizedImage;
