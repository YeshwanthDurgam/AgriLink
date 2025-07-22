import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Star, 
  ShoppingCart, 
  Truck, 
  Shield, 
  Users, 
  TrendingUp, 
  Loader2, 
  ArrowRight, 
  CheckCircle, 
  Leaf, 
  Apple, 
  Wheat, 
  Droplets, 
  Sprout, 
  Milk,
  Heart,
  Clock,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Twitter,
  Facebook,
  Youtube
} from "lucide-react";
import { apiService, Product } from "@/lib/api";
import { useEffect, useState } from 'react';

interface CarouselAnnouncement {
  _id: string;
  image: string;
  title: string;
  content: string;
  targetUrl: string; // Added targetUrl
}

const Index = () => {
  const navigate = useNavigate();

  // Fetch featured products
  const {
    data: featuredProductsData,
    isLoading: isLoadingFeatured,
    error: featuredError
  } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => apiService.getFeaturedProducts(6),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  });

  // Fetch all products for the new section
  const {
    data: allProductsData,
    isLoading: isLoadingAllProducts,
    error: allProductsError
  } = useQuery({
    queryKey: ['all-products-home'],
    queryFn: () => apiService.getProducts({ page: 1, limit: 12, status: 'active' }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Carousel announcements state
  const [carouselAnnouncements, setCarouselAnnouncements] = useState<CarouselAnnouncement[]>([]);
  useEffect(() => {
    // Fetch carousel announcements from backend
    (async () => {
      try {
        const res = await apiService.get('/announcements?type=carousel&status=active');
        console.log('Carousel API response:', res); // Debug log
        setCarouselAnnouncements(res.docs || []);
      } catch (err) {
        setCarouselAnnouncements([]);
      }
    })();
  }, []);

  // Carousel component
  const [carouselIndex, setCarouselIndex] = useState(0);
  useEffect(() => {
    if (carouselAnnouncements.length > 1) {
      const interval = setInterval(() => {
        setCarouselIndex((prev) => (prev + 1) % carouselAnnouncements.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [carouselAnnouncements]);

  const stats = [
    { 
      icon: Users, 
      label: "Active Farmers", 
      value: "1000+", 
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Trusted farmers across India"
    },
    { 
      icon: ShoppingCart, 
      label: "Products Available", 
      value: "5000+", 
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Fresh produce varieties"
    },
    { 
      icon: Truck, 
      label: "Deliveries Made", 
      value: "10,000+", 
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Happy customers served"
    },
    { 
      icon: Star, 
      label: "Customer Rating", 
      value: "4.8/5", 
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      description: "Excellent satisfaction rate"
    }
  ];

  const categories = [
    {
      name: "Vegetables",
      icon: Leaf,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      count: "200+",
      description: "Fresh organic vegetables"
    },
    {
      name: "Fruits",
      icon: Apple,
      color: "bg-red-500",
      bgColor: "bg-red-50",
      count: "150+",
      description: "Seasonal fresh fruits"
    },
    {
      name: "Grains",
      icon: Wheat,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
      count: "100+",
      description: "Quality grains & cereals"
    },
    {
      name: "Herbs",
      icon: Sprout,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      count: "80+",
      description: "Aromatic herbs & spices"
    },
    {
      name: "Dairy",
      icon: Milk,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      count: "50+",
      description: "Fresh dairy products"
    },
    {
      name: "Seeds",
      icon: Droplets,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      count: "120+",
      description: "Premium quality seeds"
    }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Home Chef",
      location: "Mumbai",
      rating: 5,
      comment: "The quality of vegetables is outstanding! Fresh from farm delivery has transformed my cooking.",
      avatar: "PS"
    },
    {
      name: "Rajesh Kumar",
      role: "Restaurant Owner",
      location: "Delhi",
      rating: 5,
      comment: "Best prices and freshest produce. Our customers love the quality we get from AgriDirect.",
      avatar: "RK"
    },
    {
      name: "Anita Patel",
      role: "Health Enthusiast",
      location: "Bangalore",
      rating: 5,
      comment: "Organic products delivered right to my doorstep. Couldn't ask for better service!",
      avatar: "AP"
    }
  ];

  const features = [
    {
      icon: Shield,
      title: "Quality Assured",
      description: "All products are quality checked before delivery with our rigorous standards",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      description: "Fresh produce delivered within 24 hours to maintain maximum freshness",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Star,
      title: "Best Prices",
      description: "Direct from farmers means better prices for you, cutting out middlemen",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: Heart,
      title: "Support Farmers",
      description: "Your purchase directly supports local farmers and sustainable agriculture",
      color: "text-red-600",
      bgColor: "bg-red-50"
    }
  ];

  // Transform API data to match ProductCard expectations
  const transformProductForCard = (product: Product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    unit: product.unit,
    quantity: product.quantity,
    category: product.category,
    description: product.description,
    images: product.images || [],
    farmer: {
      name: product.farmer.name,
      location: product.farmer.location || "Unknown",
      rating: (product.farmer && typeof product.farmer.rating === 'number') ? product.farmer.rating : 0
    },
    harvestDate: product.harvestDate,
    organic: product.organic
  });

  const featuredProducts = featuredProductsData?.products || [];
  const allProducts = allProductsData?.products || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />
      {/* Homepage Carousel */}
      <div className="w-full bg-white shadow mb-8">
        {carouselAnnouncements.filter(slide => slide.image && slide.title && slide.targetUrl).length > 0 ? (
          <div className="relative max-w-6xl mx-auto">
            <div className="overflow-hidden rounded-xl h-80 bg-gray-100 w-full relative">
              {carouselAnnouncements.filter(slide => slide.image && slide.title && slide.targetUrl).map((slide, idx) => {
                const isInternal = slide.targetUrl.startsWith('/') || slide.targetUrl.startsWith(window.location.origin);
                return (
                  <div
                    key={slide._id}
                    className={`absolute top-0 left-0 w-full h-full transition-opacity duration-700 ease-in-out cursor-pointer ${idx === carouselIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    style={{ pointerEvents: idx === carouselIndex ? 'auto' : 'none', textDecoration: 'none' }}
                    onClick={() => {
                      if (isInternal) {
                        // Remove domain if present
                        let path = slide.targetUrl;
                        if (path.startsWith(window.location.origin)) {
                          path = path.replace(window.location.origin, '');
                        }
                        navigate(path);
                      } else {
                        window.open(slide.targetUrl, '_blank', 'noopener');
                      }
                    }}
                  >
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-80 object-cover rounded-xl"
                      style={{ width: '100%', height: '20rem', objectFit: 'cover', display: 'block' }}
                    />
                    <div className="absolute bottom-0 left-0 w-full p-6 bg-black bg-opacity-60 rounded-b-xl">
                      <h3 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">{slide.title}</h3>
                      <p className="text-white text-lg drop-shadow-lg">{slide.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Carousel dots */}
            <div className="flex justify-center gap-2 mt-2 relative z-20">
              {carouselAnnouncements.filter(slide => slide.image && slide.title && slide.targetUrl).map((_, idx) => (
                <button
                  key={idx}
                  className={`w-3 h-3 rounded-full ${idx === carouselIndex ? 'bg-green-600' : 'bg-gray-300'}`}
                  onClick={() => setCarouselIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">No carousel slides available</div>
        )}
      </div>
      
      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white py-16 sm:py-20 md:py-28">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30 transition-all">
            <Leaf className="w-4 h-4 mr-2" />
            Fresh From Farm to Table
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
            Fresh From Farm to Your{" "}
            <span className="text-yellow-300">Table</span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-10 max-w-3xl mx-auto opacity-90 leading-relaxed">
            Connect directly with farmers and get the freshest produce delivered to your doorstep. 
            Supporting local agriculture, one order at a time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="bg-white text-green-700 hover:bg-gray-100 w-full sm:w-auto text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              onClick={() => navigate('/marketplace')}
            >
              <ShoppingCart className="mr-3 h-6 w-6" />
              Start Shopping Now
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white hover:text-green-700 w-full sm:w-auto text-lg px-8 py-6 transition-all duration-300 transform hover:scale-105"
              onClick={() => navigate('/farmers')}
            >
              Meet Our Farmers
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm opacity-80">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-300" />
              <span>100% Organic</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-300" />
              <span>24hr Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-300" />
              <span>Quality Assured</span>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why Choose AgriDirect?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Join thousands of satisfied customers who trust us for their daily fresh produce needs</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
                  <CardContent className="p-6 sm:p-8">
                    <div className={`w-16 h-16 ${stat.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`h-8 w-8 ${stat.color}`} />
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                    <p className="text-lg font-semibold text-gray-700 mb-2">{stat.label}</p>
                    <p className="text-sm text-gray-500">{stat.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Category Showcase */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Explore our wide range of fresh produce categories</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {categories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <Card 
                  key={index} 
                  className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group"
                  onClick={() => navigate(`/marketplace?category=${category.name}`)}
                >
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 ${category.bgColor} rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`h-6 w-6 ${category.color}`} />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{category.count} items</p>
                    <p className="text-xs text-gray-400">{category.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-200">
              <Star className="w-4 h-4 mr-2" />
              Featured Products
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Handpicked for You</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Fresh picks from our trusted farmers, carefully selected for quality and taste</p>
          </div>
          
          {/* Loading State */}
          {isLoadingFeatured && (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
                <p className="text-gray-600">Loading featured products...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {featuredError && !isLoadingFeatured && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Unable to load featured products</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          )}

          {/* Featured Products Grid */}
          {!isLoadingFeatured && !featuredError && featuredProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={transformProductForCard(product)}
                  showFarmerInfo={true}
                />
              ))}
            </div>
          )}

          {/* No Featured Products */}
          {!isLoadingFeatured && !featuredError && featuredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No featured products available at the moment</p>
              <Button 
                onClick={() => navigate('/marketplace')}
                className="bg-green-600 hover:bg-green-700"
              >
                Browse All Products
              </Button>
            </div>
          )}
          
          <div className="text-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/marketplace')}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              View All Featured Products
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* All Products Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Complete Collection</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Discover our complete collection of fresh produce from all categories</p>
          </div>
          
          {/* Loading State */}
          {isLoadingAllProducts && (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
                <p className="text-gray-600">Loading products...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {allProductsError && !isLoadingAllProducts && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Unable to load products</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          )}

          {/* All Products Grid */}
          {!isLoadingAllProducts && !allProductsError && allProducts.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 mb-12">
                {allProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={transformProductForCard(product)}
                    showFarmerInfo={true}
                  />
                ))}
              </div>
              
              <div className="text-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/marketplace')}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Explore Full Marketplace
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </div>
            </>
          )}

          {/* No Products */}
          {!isLoadingAllProducts && !allProductsError && allProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No products available at the moment</p>
              <Button 
                onClick={() => navigate('/marketplace')}
                className="bg-green-600 hover:bg-green-700"
              >
                Check Marketplace
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Real stories from real customers who love our fresh produce</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">"{testimonial.comment}"</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-green-700 font-semibold">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500">{testimonial.role} • {testimonial.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why Choose AgriDirect?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">We're committed to bringing you the best fresh produce experience</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
                  <CardContent className="p-6 sm:p-8">
                    <div className={`w-16 h-16 ${feature.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Stay Updated</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Get the latest updates on new products, seasonal offers, and farming stories delivered to your inbox
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email address" 
              className="flex-1 text-gray-900 placeholder-gray-500"
            />
            <Button className="bg-white text-green-700 hover:bg-gray-100 px-8">
              Subscribe
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">AgriDirect</h3>
              <p className="text-gray-400 mb-4">Connecting farmers directly to consumers for fresher, better produce.</p>
              <div className="flex space-x-4">
                <Instagram className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                <Twitter className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                <Facebook className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                <Youtube className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Our Farmers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Sustainability</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Shipping Info</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Returns</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>Mumbai, Maharashtra, India</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>hello@agridirect.com</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AgriDirect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
