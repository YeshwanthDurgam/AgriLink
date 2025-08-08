import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Backend base URL for constructing full image URLs
// Prefer VITE_API_BASE_URL but strip trailing /api to get the true backend origin
const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const BACKEND_ORIGIN = RAW_API_BASE.replace(/\/?api\/?$/, '');

/**
 * Constructs the full URL for an image by combining the backend base URL with the image path
 * @param imagePath - The image path from the backend (e.g., '/uploads/products/filename.jpg')
 * @returns The full URL to access the image
 */
export function getImageUrl(imagePath: string): string {
  if (!imagePath) return '/placeholder.svg';

  // If already absolute URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Ensure leading slash
  const withLeadingSlash = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  // If it's an uploads path (products or reviews), just prefix backend origin
  if (withLeadingSlash.startsWith('/uploads/')) {
    return `${BACKEND_ORIGIN}${withLeadingSlash}`;
  }

  // Fallback: assume it's a product image filename
  return `${BACKEND_ORIGIN}/uploads/products/${withLeadingSlash.replace(/^\//, '')}`;
}

/**
 * Gets the primary image URL from a product's images array
 * @param images - Array of product images
 * @returns The URL of the primary image or a placeholder
 */
export function getPrimaryImageUrl(images: any[]): string {
  if (!images || images.length === 0) {
    return '/placeholder.svg'; // Return a placeholder if no images exist
  }
  const primaryImage = images.find(img => img.isPrimary);
  const url = primaryImage ? primaryImage.url : images[0].url;

  // Use the getImageUrl utility to construct the full path
  return getImageUrl(url);
}
