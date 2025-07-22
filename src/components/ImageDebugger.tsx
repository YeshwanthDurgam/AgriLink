import { useState } from 'react';
import { getImageUrl } from '@/lib/utils';

interface ImageDebuggerProps {
  imagePath: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

const ImageDebugger = ({ 
  imagePath, 
  alt, 
  className = "w-full h-full object-cover",
  fallbackSrc = '/placeholder.svg'
}: ImageDebuggerProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const fullImageUrl = getImageUrl(imagePath);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageError(true);
    setImageLoaded(false);
    // Fallback to placeholder
    const target = e.target as HTMLImageElement;
    target.src = fallbackSrc;
  };

  return (
    <img
      src={fullImageUrl}
      alt={alt}
      className={className}
      onLoad={handleImageLoad}
      onError={handleImageError}
    />
  );
};

export default ImageDebugger; 