import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import SearchAndFilter from "@/components/SearchAndFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Search, Loader2, AlertCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { apiService, Product } from "@/lib/api";
import { toast } from "sonner";

interface FilterOptions {
  category: string;
  location: string;
  priceRange: [number, number];
  sortBy: string;
}

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterOptions>({
    category: "",
    location: "",
    priceRange: [0, 1000],
    sortBy: "newest"
  });
  const { getTotalItems } = useCart();

  // Categories and locations for filters
  const categories = ["Vegetables", "Fruits", "Grains", "Herbs", "Seeds", "Dairy"];
  const locations = ["Maharashtra", "Karnataka", "Punjab", "Tamil Nadu", "Gujarat", "Rajasthan"];

  // Convert frontend filters to API parameters
  const getApiParams = () => {
    const params: any = {
      page: currentPage,
      limit: 12,
      status: 'active'
    };

    if (searchQuery) {
      params.search = searchQuery;
    }

    if (filters.category) {
      params.category = filters.category;
    }

    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) {
      params.minPrice = filters.priceRange[0];
      params.maxPrice = filters.priceRange[1];
    }

    // Convert sortBy to API format
    switch (filters.sortBy) {
      case 'price-low':
        params.sortBy = 'price';
        params.sortOrder = 'asc';
        break;
      case 'price-high':
        params.sortBy = 'price';
        params.sortOrder = 'desc';
        break;
      case 'rating':
        params.sortBy = 'rating';
        params.sortOrder = 'desc';
        break;
      case 'popular':
        params.sortBy = 'orders';
        params.sortOrder = 'desc';
        break;
      default:
        params.sortBy = 'createdAt';
        params.sortOrder = 'desc';
    }

    return params;
  };

  // Fetch products using React Query
  const {
    data: productsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['products', currentPage, filters, searchQuery],
    queryFn: () => apiService.getProducts(getApiParams()),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Handle filter changes
  const handleFilter = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error('Failed to load products. Please try again.');
    }
  }, [error]);

  // Transform API data to match ProductCard expectations
  const transformProductForCard = (product: Product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    unit: product.unit,
    quantity: product.quantity,
    category: product.category,
    description: product.description,
    image: product.images?.[0]?.url || "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400",
    farmer: {
      name: product.farmer.name,
      location: product.farmer.location || "Unknown",
      rating: product.farmer.rating || 0
    },
    harvestDate: product.harvestDate,
    organic: product.organic
  });

  const products = productsData?.products || [];
  const pagination = productsData?.pagination;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">🛒 Marketplace</h1>
          <p className="text-sm sm:text-base text-gray-600">Discover fresh, local produce directly from farmers</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 sm:mb-8">
          <SearchAndFilter
            onSearch={handleSearch}
            onFilter={handleFilter}
            categories={categories}
            locations={locations}
          />
        </div>

        {/* Mobile Quick Filters */}
        <div className="mb-4 sm:hidden">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleFilter({ ...filters, category: '' })}
              className={`whitespace-nowrap ${!filters.category ? 'bg-green-100 border-green-500 text-green-700' : ''}`}
            >
              All
            </Button>
            {categories.slice(0, 4).map((category) => (
              <Button 
                key={category}
                variant="outline" 
                size="sm"
                onClick={() => handleFilter({ ...filters, category })}
                className={`whitespace-nowrap ${filters.category === category ? 'bg-green-100 border-green-500 text-green-700' : ''}`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
              <p className="text-gray-600">Loading products...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card>
            <CardContent className="py-8 sm:py-12 text-center">
              <div className="text-red-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Failed to load products</p>
                <p className="text-sm mb-4">Please check your connection and try again</p>
                <Button onClick={() => refetch()} variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Summary */}
        {!isLoading && !error && (
          <div className="mb-6">
            <Card>
              <CardContent className="py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div>
                    <p className="text-base sm:text-lg font-semibold">
                      {pagination?.total || 0} Products Found
                    </p>
                    {searchQuery && (
                      <p className="text-xs sm:text-sm text-gray-600">
                        Search results for "{searchQuery}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs sm:text-sm">{filters.sortBy}</Badge>
                    {filters.category && <Badge variant="secondary" className="text-xs sm:text-sm">{filters.category}</Badge>}
                    {filters.location && <Badge variant="secondary" className="text-xs sm:text-sm">{filters.location}</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Product Grid */}
        {!isLoading && !error && products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={transformProductForCard(product)}
                  showFarmerInfo={true}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={page === pagination.currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : !isLoading && !error ? (
          <Card>
            <CardContent className="py-8 sm:py-12 text-center">
              <div className="text-gray-500">
                <p className="text-base sm:text-lg font-medium mb-2">No products found</p>
                <p className="text-sm sm:text-base">Try adjusting your search criteria or filters</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Featured Categories */}
        {!isLoading && !error && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link
                  key={category}
                  to={`/marketplace?category=${category}`}
                  className="block"
                >
                  <Card className="hover:shadow-lg transition-shadow duration-300 border-green-100">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">
                        {category === "Vegetables" && "🥬"}
                        {category === "Fruits" && "🍎"}
                        {category === "Grains" && "🌾"}
                        {category === "Herbs" && "🌿"}
                        {category === "Seeds" && "🌰"}
                        {category === "Dairy" && "🥛"}
                      </div>
                      <h3 className="font-semibold text-sm">{category}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 sm:hidden">
        <div className="flex flex-col gap-3">
          {/* Quick Search FAB */}
          <Button
            onClick={() => {
              const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
              if (searchInput) {
                searchInput.focus();
              }
            }}
            className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 shadow-lg touch-target"
            size="sm"
          >
            <Search className="h-5 w-5" />
          </Button>
          
          {/* Cart FAB */}
          <Link to="/cart">
            <Button
              className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg touch-target relative"
              size="sm"
            >
              <ShoppingCart className="h-5 w-5" />
              {getTotalItems() > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white min-w-[18px] h-5 flex items-center justify-center text-xs font-bold">
                  {getTotalItems()}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
