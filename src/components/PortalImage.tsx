import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { isLocalDevelopmentImageUrl } from '../utils/image.ts';

interface PortalImageProps {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  className: string;
  loading?: 'eager' | 'lazy';
  ariaHidden?: boolean;
}

export function PortalImage({
  src,
  fallbackSrc,
  alt,
  className,
  loading = 'lazy',
  ariaHidden = false,
}: PortalImageProps) {
  const usableSrc = src && !isLocalDevelopmentImageUrl(src) ? src : undefined;
  const preferredSrc = usableSrc ?? fallbackSrc;
  const [imageSrc, setImageSrc] = useState(preferredSrc);

  useEffect(() => {
    setImageSrc(preferredSrc);
  }, [preferredSrc]);

  if (!imageSrc) {
    return (
      <div
        role={ariaHidden ? undefined : 'img'}
        aria-label={ariaHidden ? undefined : alt ? `${alt} (image unavailable)` : 'Image unavailable'}
        aria-hidden={ariaHidden}
        className={`${className} flex items-center justify-center bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400`}
      >
        <ImageOff aria-hidden="true" className="h-8 w-8" />
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      aria-hidden={ariaHidden}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => {
        setImageSrc((currentSrc) => (
          fallbackSrc && currentSrc !== fallbackSrc ? fallbackSrc : undefined
        ));
      }}
    />
  );
}
