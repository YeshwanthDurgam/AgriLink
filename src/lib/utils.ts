import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Backend base URL for constructing full image URLs
// Use environment variable if available, otherwise default to localhost:5000
const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Constructs the full URL for an image by combining the backend base URL with the image path
 * @param imagePath - The image path from the backend (e.g., '/uploads/products/filename.jpg')
 * @returns The full URL to access the image
 */
export function getImageUrl(imagePath: string): string {
  if (!imagePath) return '/placeholder.svg';
  
  // If the image path is already a full URL, return it as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If the image path starts with '/', it's a relative path from the backend
  if (imagePath.startsWith('/')) {
    return `${BACKEND_BASE_URL}${imagePath}`;
  }
  
  // If it's just a filename, assume it's in the uploads/products directory
  return `${BACKEND_BASE_URL}/uploads/products/${imagePath}`;
}

/**
 * Gets the primary image URL from a product's images array
 * @param images - Array of product images
 * @returns The URL of the primary image or a placeholder
 */
export function getPrimaryImageUrl(images?: Array<{ url: string; alt?: string; isPrimary?: boolean }>): string {
  if (!images || images.length === 0) {
    return '/placeholder.svg';
  }
  
  // Find the primary image
  const primaryImage = images.find(img => img.isPrimary);
  if (primaryImage) {
    return getImageUrl(primaryImage.url);
  }
  
  // If no primary image is marked, use the first image
  return getImageUrl(images[0].url);
}
