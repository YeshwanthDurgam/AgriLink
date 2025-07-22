import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, Calendar, Shield, Video, Flag, ShoppingCart, Star } from 'lucide-react';
import { toast } from 'sonner';
import FarmerReputationBadge from '@/components/FarmerReputationBadge';
import ReviewSystem from '@/components/ReviewSystem';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fetch real product data
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiService.getProduct(id!),
    enabled: !!id,
  });



  // Defensive: loading and error states
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  // Defensive: error or missing product
  if (error || !product || Object.keys(product).length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Product not found or failed to load. Please try again or select another product.</p>
        </div>
      </div>
    );
  }

  // Gallery logic (defensive)
  const images = Array.isArray((product as any).images) && (product as any).images.length > 0
    ? (product as any).images.map((img: any) => ({
        ...img,
        id: img.id || img._id || `img-${Math.random()}`
      }))
    : [{ url: '/placeholder.svg', id: 'placeholder' }];
  const mainImage = getImageUrl(images[selectedImageIndex]?.url) || '/placeholder.svg';

  // Defensive values for all fields
  const price = (product as any)?.price ?? (product as any)?.basePrice ?? 0;
  const quantity = (product as any)?.quantity ?? 0;
  const unit = (product as any)?.unit ?? '';
  const harvestDate = (product as any)?.harvestDate ? new Date((product as any).harvestDate).toLocaleDateString() : 'N/A';
  const farmerName = (product as any)?.farmer?.name || 'Unknown';
  const farmerLocation = (product as any)?.farmer?.location || 'Location not set';
  const farmerRating = (product as any)?.farmer?.rating ?? 0;
  const qualityMetrics = (product as any)?.qualityMetrics || {};
  const isOrganic = (product as any)?.organic;
  const isInStock = ((product as any)?.status === 'active') && quantity > 0;
  const certifications = Array.isArray((product as any)?.certifications) ? (product as any).certifications : [];
  const deliveryTime = (product as any)?.deliveryTime ?? 24;
  const description = (product as any)?.description || '';
  const category = (product as any)?.category || '';

  const handleAddToCart = () => {
    if (product) {
      toast.success(`${product?.name || 'Product'} added to cart!`);
    }
  };

  const handleFlagProduct = () => {
    toast.info('Product flagged for review');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{product?.name || 'Product'}</h1>
              <p className="text-gray-600 text-sm">{category}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFlagProduct}
              className="text-red-600 hover:text-red-700"
            >
              <Flag className="w-4 h-4 mr-1" />
              Report
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Gallery */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-white shadow-md flex items-center justify-center">
              <img
                src={mainImage}
                alt={product?.name || 'Product'}
                className="w-full h-full object-contain max-h-[400px]"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
            </div>
            <div className="flex gap-2 mt-2">
              {images.map((img, idx) => (
                <button
                  key={img.id || img._id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`border rounded-md p-1 bg-white focus:outline-none ${selectedImageIndex === idx ? 'border-green-600' : 'border-gray-200'}`}
                  style={{ width: 64, height: 64 }}
                  type="button"
                >
                  <img
                    src={getImageUrl(img.url)}
                    alt={img.alt || product?.name || 'Product'}
                    className="object-contain w-full h-full"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info & Actions */}
          <div className="space-y-6">
            {/* Price, Stock, Badges */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl font-bold text-green-600">₹{price}</span>
                <span className="text-gray-600 text-base">per {unit}</span>
                {isInStock ? (
                  <Badge className="bg-green-100 text-green-800 ml-2">In Stock</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 ml-2">Out of Stock</Badge>
                )}
                {isOrganic && <Badge className="bg-green-600 text-white ml-2">Organic</Badge>}
                {certifications.length > 0 && certifications.map(cert => (
                  <Badge key={cert} className="bg-blue-100 text-blue-800 ml-2">{cert}</Badge>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {quantity} {unit}{quantity === 1 ? '' : 's'} available
              </p>
            </div>

            {/* Key Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar className="w-4 h-4" />
                <span>Harvested: {harvestDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Shield className="w-4 h-4" />
                <span>Quality Grade: {product?.qualityGrade || 'Standard'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="w-4 h-4" />
                <span>Seller: {farmerName} ({farmerLocation})</span>
                <Star className="w-4 h-4 text-yellow-400 ml-1" />
                <span>{farmerRating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>Delivery: {deliveryTime} hrs</span>
              </div>
            </div>

            {/* Add to Cart/Buy Now */}
            <div className="flex flex-col gap-3 mt-6">
              <Button
                onClick={handleAddToCart}
                disabled={!isInStock}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 py-3 text-lg"
              >
                {isInStock ? (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart - ₹{price}
                  </>
                ) : (
                  'Out of Stock'
                )}
              </Button>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Product Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{description}</p>
            </div>

            {/* Quality Metrics (if available) */}
            {(qualityMetrics.taste !== undefined || qualityMetrics.freshness !== undefined || qualityMetrics.quantity !== undefined || qualityMetrics.packaging !== undefined) && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Quality Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {qualityMetrics.taste !== undefined ? qualityMetrics.taste.toFixed(1) : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">Taste</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {qualityMetrics.freshness !== undefined ? qualityMetrics.freshness.toFixed(1) : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">Freshness</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {qualityMetrics.quantity !== undefined ? qualityMetrics.quantity.toFixed(1) : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">Quantity Match</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {qualityMetrics.packaging !== undefined ? qualityMetrics.packaging.toFixed(1) : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">Packaging</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Reviews & Ratings */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-4">Reviews & Ratings</h2>
          <ReviewSystem
            productId={id!}
            productName={product?.name || 'Product'}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
