import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartCrack, Loader2 } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

const WishlistPage = () => {
  const queryClient = useQueryClient();
  const { data: wishlistData, isLoading, error } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => apiService.getWishlist(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const wishlistProducts = wishlistData?.wishlist?.products || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    toast.error('Failed to load wishlist. Please try again.');
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center text-red-500">
          <p>Error loading wishlist. {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Wishlist</h1>

        {wishlistProducts.length === 0 ? (
          <div className="text-center py-12">
            <HeartCrack className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No items in your wishlist yet.</h3>
            <p className="text-gray-600 mb-8">Start exploring the marketplace to add products you love!</p>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link to="/marketplace">Explore Marketplace</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistProducts
              .filter((item: any) => item.product) // Filter out items where product is null/undefined
              .map((item: any) => (
                <Card key={item.product._id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <Link to={`/product/${item.product._id}`}>
                    <img
                      src={(Array.isArray(item.product.images) && item.product.images.length > 0) ? getImageUrl(item.product.images[0].url) : '/placeholder.svg'}
                      alt={item.product.name}
                      className="w-full h-48 object-cover"
                      onError={(e) => { const target = e.target as HTMLImageElement; target.src = '/placeholder.svg'; }}
                    />
                  </Link>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold truncate">{item.product.name}</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      {item.product.category} - {item.product.farmer?.name || 'Unknown Farmer'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-green-600">₹{(item.product.price ?? 0).toFixed(2)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async (e) => {
                          e.preventDefault(); // Prevent navigating to product detail
                          const previousWishlist = queryClient.getQueryData(['wishlist']);
                          try {
                            // Optimistically remove
                            queryClient.setQueryData(['wishlist'], (old: any) => ({
                              ...old,
                              wishlist: {
                                ...old?.wishlist,
                                products: old?.wishlist?.products?.filter((pItem: any) => pItem.product._id !== item.product._id),
                              },
                            }));
                            await apiService.removeProductFromWishlist(item.product._id);
                            toast.success(`${item.product.name} removed from wishlist`);
                          } catch (error) {
                            toast.error(`Failed to remove from wishlist: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
                            // Revert optimistic update on error
                            queryClient.setQueryData(['wishlist'], previousWishlist);
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage; 