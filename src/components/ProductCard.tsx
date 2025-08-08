import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, MapPin, Calendar, Star, Heart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { getPrimaryImageUrl } from '@/lib/utils';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';

interface Product {
  id: string;
  name: string;
  price?: number;
  basePrice?: number;
  unit: string;
  quantity: number;
  category: string;
  description: string;
  images?: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
  farmer: {
    name: string;
    location: string;
    rating: number;
  };
  harvestDate: string;
  organic: boolean;
  deal?: string; // Added for deals
  discount?: number; // Added for discounts
  isWishlisted?: boolean; // Add this property
  averageRating?: number;
  reviewCount?: number;
}

interface ProductCardProps {
  product: Product;
  showFarmerInfo?: boolean;
  showDealBadge?: boolean;
}

const ProductCard = ({ product, showFarmerInfo = true, showDealBadge = false }: ProductCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const queryClient = useQueryClient();

  // Fetch current wishlist state for the user
  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => apiService.getWishlist(),
    staleTime: Infinity, // Wishlist state doesn't change often unless user interacts
  });

  const isWishlisted = wishlistData?.wishlist?.products?.some((item: any) => item.product._id === product.id) || false;

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const previousWishlist = queryClient.getQueryData(['wishlist']);

    try {
      if (isWishlisted) {
        // Optimistically remove
        queryClient.setQueryData(['wishlist'], (old: any) => ({
          ...old,
          wishlist: {
            ...old?.wishlist,
            products: old?.wishlist?.products?.filter((item: any) => item.product._id !== product.id),
          },
        }));
        await apiService.removeProductFromWishlist(product.id);
        toast.success(`${product.name} removed from wishlist`);
      } else {
        // Optimistically add
        queryClient.setQueryData(['wishlist'], (old: any) => ({
          ...old,
          wishlist: {
            ...old?.wishlist,
            products: [...(old?.wishlist?.products || []), { product: { _id: product.id, name: product.name, images: product.images, price: product.price, category: product.category, farmer: product.farmer } }],
          },
        }));
        await apiService.addProductToWishlist(product.id);
        toast.success(`${product.name} added to wishlist`);
      }
    } catch (error) {
      toast.error(`Failed to update wishlist: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
      // Revert optimistic update on error
      queryClient.setQueryData(['wishlist'], previousWishlist);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    addToCart(product);
    setIsLoading(false);
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'vegetables': return 'bg-green-100 text-green-800';
      case 'fruits': return 'bg-orange-100 text-orange-800';
      case 'grains': return 'bg-yellow-100 text-yellow-800';
      case 'dairy': return 'bg-blue-100 text-blue-800';
      case 'seeds': return 'bg-purple-100 text-purple-800';
      case 'herbs & spices': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100 cursor-pointer h-full flex flex-col group bg-white"
      onClick={handleCardClick}
    >
      <div className="relative bg-gray-50">
        <img 
          src={getPrimaryImageUrl(Array.isArray(product.images) ? product.images : [])}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder.svg';
          }}
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1 sm:gap-2">
          {showDealBadge && (product.deal || (product.discount && product.discount > 0)) && (
            <Badge className="bg-red-500 text-white text-xs sm:text-sm font-bold">
              {product.discount && product.discount > 0 ? `-${product.discount}%` : 'Deal!'}
            </Badge>
          )}
          <Badge className={`${getCategoryColor(product.category)} text-xs sm:text-sm`}>
            {product.category}
          </Badge>
          {product.organic && (
            <Badge className="bg-green-600 text-white text-xs sm:text-sm">Organic</Badge>
          )}
        </div>
        <div className="absolute top-2 right-2">
          {/* Wishlist Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/80 hover:bg-white text-red-500 hover:text-red-600 rounded-full shadow-sm transition-all duration-300"
            onClick={handleToggleWishlist}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={isWishlisted ? 'fill-red-500' : ''} />
          </Button>
          {showFarmerInfo && (
            <div className="bg-white rounded-full px-2 py-1 flex items-center space-x-1 text-xs shadow-sm mt-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{product.farmer.rating}</span>
            </div>
          )}
        </div>
        {/* Mobile Quick Add Button - Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button 
            onClick={handleAddToCart}
            disabled={isLoading || product.quantity === 0}
            className="bg-white text-green-600 hover:bg-green-50 disabled:bg-gray-300 shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300"
            size="sm"
          >
            {isLoading ? (
              "Adding..."
            ) : product.quantity === 0 ? (
              "Out of Stock"
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Quick Add
              </>
            )}
          </Button>
        </div>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2 group-hover:text-green-600 transition-colors">{product.name}</h3>
          <div className="text-right flex-shrink-0">
            <p className="text-base sm:text-lg font-bold text-green-600">₹{product.basePrice ?? product.price}</p>
            <p className="text-xs sm:text-sm text-gray-500">per {product.unit}</p>
          </div>
        </div>

        {/* Rating summary */}
        {(product.averageRating || product.reviewCount) && (
          <div className="flex items-center gap-1 mb-2 text-xs text-gray-600">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span>{(product.averageRating || 0).toFixed(1)}</span>
            <span>({product.reviewCount || 0})</span>
          </div>
        )}

        <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-1">{product.description}</p>

        <div className="space-y-2">
          <div className="flex items-center text-xs sm:text-sm text-gray-500">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
            <span className="truncate">Harvested: {new Date(product.harvestDate).toLocaleDateString()}</span>
          </div>
          
          {showFarmerInfo && (
            <div className="flex items-center text-xs sm:text-sm text-gray-500">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{product.farmer.name}, {product.farmer.location}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="text-gray-500 truncate mr-2">Available: {product.quantity} {product.unit}s</span>
            <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-1.5 sm:h-2 flex-shrink-0">
              <div 
                className="bg-green-500 h-1.5 sm:h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min((product.quantity / 100) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={handleAddToCart}
          disabled={isLoading || product.quantity === 0}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-base touch-target group-hover:shadow-lg transition-all duration-300"
        >
          {isLoading ? (
            "Adding..."
          ) : product.quantity === 0 ? (
            "Out of Stock"
          ) : (
            <>
              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Add to Cart</span>
              <span className="sm:hidden">Add</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
