import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NotificationCenter from "@/components/NotificationCenter";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ShoppingCart, 
  User, 
  LogOut, 
  Search, 
  Menu, 
  MapPin, 
  ChevronDown,
  Heart,
  Package,
  Sparkles,
  Star,
  Settings,
  CreditCard,
  HelpCircle,
  Shield,
  TrendingUp,
  Plus,
  FileText,
  Home,
  X,
  Bell
} from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { getTotalItems } = useCart();
  const location = useLocation();
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const queryClient = useQueryClient();

  console.log("Header User Role:", user?.role); // Add this line

  // Fetch wishlist data for header display
  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => apiService.getWishlist(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isAuthenticated, // Only fetch if user is authenticated
  });

  const wishlistCount = wishlistData?.wishlist?.products?.length || 0;

  // Fetch orders data for header display
  const { data: ordersData } = useQuery({
    queryKey: ['orders', 'header'], // Use a specific query key for header orders
    queryFn: () => apiService.getUserOrders(1, 10, 'pending'), // Fetch only pending orders for the count
    staleTime: 60 * 1000, // 1 minute
    enabled: isAuthenticated, // Only fetch if user is authenticated
  });

  const orderCount = ordersData?.orders?.length || 0;

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const toggleAccountDropdown = () => {
    setShowAccountDropdown(!showAccountDropdown);
  };

  const closeAccountDropdown = () => {
    setShowAccountDropdown(false);
  };

  return (
    <div className="bg-white shadow-lg border-b border-gray-100">
      {/* Top Bar - Location and Account - Hidden on mobile */}
      <div className="hidden md:block bg-gradient-to-r from-green-50 to-emerald-50 py-2 px-4 border-b border-green-100">
        <div className="container mx-auto flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 bg-white px-3 py-1 rounded-full shadow-sm border border-green-200">
              <MapPin className="h-3 w-3 text-green-600" />
              <span>Deliver to</span>
              <span className="font-semibold text-green-700">India</span>
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <Sparkles className="h-3 w-3" />
              <span className="font-medium">Fresh from Farm to Table</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <span className="text-green-600 font-semibold flex items-center space-x-1">
                  <Star className="h-3 w-3" />
                  <span>Hi, {user?.name}</span>
                </span>
                <Link to="/profile" className="hover:text-green-600 transition-colors duration-200 font-medium">Your Account</Link>
                <Link to="/orders" className="hover:text-green-600 transition-colors duration-200 font-medium">Your Orders</Link>
                {user?.role === 'farmer' && (
                  <Link to="/farmer-dashboard" className="hover:text-green-600 transition-colors duration-200 font-medium bg-green-100 px-2 py-1 rounded">Farmer Dashboard</Link>
                )}
                {user?.role === 'admin' && (
                  <Link to="/admin" className="hover:text-green-600 transition-colors duration-200 font-medium bg-red-100 px-2 py-1 rounded">Admin Panel</Link>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-green-600 transition-colors duration-200 font-medium">Sign In</Link>
                <Link to="/register" className="hover:text-green-600 transition-colors duration-200 font-medium bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 transition-all duration-200">Register</Link>
              </>
            )}
            <Link to="/support" className="hover:text-green-600 transition-colors duration-200 font-medium">Customer Service</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
              <span className="text-white font-bold text-sm sm:text-base">A</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">AgriDirect</span>
              <span className="text-xs text-gray-500 -mt-1 hidden sm:block">Fresh & Organic</span>
            </div>
          </Link>

          {/* Search Bar - Desktop Only */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
            <div className="relative group w-full">
              <Input
                type="text"
                placeholder="Search for fresh vegetables, fruits, dairy products..."
                className="w-full pl-4 pr-12 py-3 border-2 border-green-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 shadow-sm group-hover:shadow-md"
              />
              <Button 
                className="absolute right-2 top-1.5 h-8 w-10 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                size="sm"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Wishlist */}
              <Link to="/wishlist" className="flex flex-col items-center text-xs hover:text-green-600 transition-all duration-200 group">
                <div className="relative">
                  <Heart className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
                  {wishlistCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <span className="font-medium">Wishlist</span>
              </Link>

              {/* Orders */}
              <Link to={user?.role === 'admin' ? '/admin/orders' : '/orders'} className="flex flex-col items-center text-xs hover:text-green-600 transition-all duration-200 group">
                <div className="relative">
                  <Package className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
                  {orderCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-blue-500 text-white min-w-[20px] h-6 flex items-center justify-center text-xs font-bold shadow-lg animate-pulse-glow">
                      {orderCount}
                    </Badge>
                  )}
                </div>
                <span className="font-medium">Orders</span>
              </Link>

              {/* Cart */}
              <Link to="/cart" className="flex flex-col items-center text-xs hover:text-green-600 transition-all duration-200 group relative">
                <ShoppingCart className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-medium">Cart</span>
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white min-w-[20px] h-6 flex items-center justify-center text-xs font-bold shadow-lg animate-pulse-glow">
                    {getTotalItems()}
                  </Badge>
                )}
              </Link>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center space-x-3">
              {/* Mobile Search Icon */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 touch-target"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Mobile Cart */}
              <Link to="/cart" className="relative p-2 touch-target">
                <ShoppingCart className="h-5 w-5" />
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white min-w-[16px] h-5 flex items-center justify-center text-xs font-bold">
                    {getTotalItems()}
                  </Badge>
                )}
              </Link>

              {/* Mobile Notifications */}
              <NotificationCenter />

              {/* Mobile Menu - More Prominent */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2 touch-target bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg shadow-sm">
                    <Menu className="h-5 w-5 text-gray-700" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 sm:w-96">
                  <div className="flex flex-col h-full">
                    {/* Mobile Menu Header */}
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                        <Button variant="ghost" size="sm" className="p-1 hover:bg-gray-200 rounded-full">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Mobile Search */}
                    <div className="p-4 border-b border-gray-200 bg-white">
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Search products..."
                          className="w-full pl-10 pr-4 py-3 border-2 border-green-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    {/* User Section */}
                    {isAuthenticated ? (
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{user?.name}</h3>
                            <p className="text-sm text-gray-600">{user?.email}</p>
                            <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium capitalize">
                              {user?.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border-b border-gray-200">
                        <div className="space-y-2">
                          <Link to="/login" className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                            Sign In
                          </Link>
                          <Link to="/register" className="block w-full text-center border border-green-600 text-green-600 py-2 px-4 rounded-lg hover:bg-green-50 transition-colors">
                            Register
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Navigation Links */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="p-4 space-y-2">
                        <Link to="/" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <Home className="h-5 w-5" />
                          <span>Home</span>
                        </Link>
                        
                        <Link to="/marketplace" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <Package className="h-5 w-5" />
                          <span>Marketplace</span>
                        </Link>

                        <Link to="/categories" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <Menu className="h-5 w-5" />
                          <span>Categories</span>
                        </Link>

                        <Link to="/deals" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <Sparkles className="h-5 w-5" />
                          <span>Today's Deals</span>
                        </Link>

                        <Link to="/farmers" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <User className="h-5 w-5" />
                          <span>Local Farmers</span>
                        </Link>

                        {isAuthenticated && (
                          <>
                            <Link to="/profile" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                              <Settings className="h-5 w-5" />
                              <span>Profile</span>
                            </Link>
                            
                            <Link to="/orders" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                              <Package className="h-5 w-5" />
                              <span>Orders</span>
                            </Link>

                            <Link to="/wishlist" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                              <Heart className="h-5 w-5" />
                              <span>Wishlist</span>
                            </Link>
                          </>
                        )}

                        {/* Role-specific Links */}
                        {isAuthenticated && user?.role === 'farmer' && (
                          <>
                            <Link to="/farmer-dashboard" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                              <Home className="h-5 w-5" />
                              <span>Farmer Dashboard</span>
                            </Link>
                            
                            <Link to="/add-product" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                              <Plus className="h-5 w-5" />
                              <span>Add Product</span>
                            </Link>
                            
                            <Link to="/manage-products" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                              <FileText className="h-5 w-5" />
                              <span>My Products</span>
                            </Link>
                            
                            <Link to="/farmer-earnings" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                              <TrendingUp className="h-5 w-5" />
                              <span>Earnings</span>
                            </Link>
                          </>
                        )}

                        {isAuthenticated && user?.role === 'admin' && (
                          <>
                            <Link to="/admin" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                              <Shield className="h-5 w-5" />
                              <span>Admin Dashboard</span>
                            </Link>
                          </>
                        )}

                        <Link to="/support" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <HelpCircle className="h-5 w-5" />
                          <span>Support</span>
                        </Link>

                        {isAuthenticated && (
                          <button 
                            onClick={handleLogout}
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 transition-colors w-full text-left"
                          >
                            <LogOut className="h-5 w-5 text-red-600" />
                            <span className="text-red-600">Sign Out</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop User Account */}
            {isAuthenticated && (
              <div className="hidden md:block relative">
                <div 
                  className="flex flex-col items-center text-xs group cursor-pointer"
                  onClick={toggleAccountDropdown}
                  onMouseEnter={() => setShowAccountDropdown(true)}
                >
                  <div className="flex items-center space-x-1">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showAccountDropdown ? 'rotate-180' : ''}`} />
                  </div>
                  <span className="font-medium">Account</span>
                </div>

                {/* Account Dropdown Menu */}
                {showAccountDropdown && (
                  <div 
                    className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50"
                    onMouseLeave={closeAccountDropdown}
                  >
                    {/* User Info Header */}
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                          <p className="text-sm text-gray-600">{user?.email}</p>
                          <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium capitalize">
                            {user?.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      {/* Profile & Account */}
                      <div className="mb-2">
                        <Link 
                          to="/profile" 
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                          onClick={closeAccountDropdown}
                        >
                          <User className="h-5 w-5 text-gray-600" />
                          <span className="font-medium">Your Profile</span>
                        </Link>
                        
                        <Link 
                          to="/orders" 
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                          onClick={closeAccountDropdown}
                        >
                          <Package className="h-5 w-5 text-gray-600" />
                          <span className="font-medium">Your Orders</span>
                        </Link>
                      </div>

                      {/* Role-specific Options */}
                      {user?.role === 'buyer' && (
                        <div className="mb-2 border-t border-gray-100 pt-2">
                          <Link 
                            to="/wishlist" 
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            onClick={closeAccountDropdown}
                          >
                            <Heart className="h-5 w-5 text-gray-600" />
                            <span className="font-medium">Wishlist</span>
                          </Link>
                          
                          <Link 
                            to="/cart" 
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            onClick={closeAccountDropdown}
                          >
                            <ShoppingCart className="h-5 w-5 text-gray-600" />
                            <span className="font-medium">Shopping Cart</span>
                          </Link>
                        </div>
                      )}

                      {user?.role === 'farmer' && (
                        <div className="mb-2 border-t border-gray-100 pt-2">
                          <Link 
                            to="/farmer-dashboard" 
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            onClick={closeAccountDropdown}
                          >
                            <Home className="h-5 w-5 text-gray-600" />
                            <span className="font-medium">Farmer Dashboard</span>
                          </Link>
                          
                          <Link 
                            to="/manage-products" 
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            onClick={closeAccountDropdown}
                          >
                            <FileText className="h-5 w-5 text-gray-600" />
                            <span className="font-medium">My Products</span>
                          </Link>
                          
                          <Link 
                            to="/add-product" 
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            onClick={closeAccountDropdown}
                          >
                            <Plus className="h-5 w-5 text-gray-600" />
                            <span className="font-medium">Add New Product</span>
                          </Link>
                          
                          <Link 
                            to="/farmer-earnings" 
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            onClick={closeAccountDropdown}
                          >
                            <TrendingUp className="h-5 w-5 text-gray-600" />
                            <span className="font-medium">Earnings & Analytics</span>
                          </Link>
                        </div>
                      )}

                      {user?.role === 'admin' && (
                        <div className="mb-2 border-t border-gray-100 pt-2">
                          <Link 
                            to="/admin" 
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            onClick={closeAccountDropdown}
                          >
                            <Shield className="h-5 w-5 text-gray-600" />
                            <span className="font-medium">Admin Dashboard</span>
                          </Link>
                          
                          <Link 
                            to="/manage-products" 
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            onClick={closeAccountDropdown}
                          >
                            <FileText className="h-5 w-5 text-gray-600" />
                            <span className="font-medium">Product Management</span>
                          </Link>
                        </div>
                      )}

                      {/* Settings & Support */}
                      <div className="mb-2 border-t border-gray-100 pt-2">
                        <Link 
                          to="/profile" 
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                          onClick={closeAccountDropdown}
                        >
                          <Settings className="h-5 w-5 text-gray-600" />
                          <span className="font-medium">Account Settings</span>
                        </Link>
                        
                        <Link 
                          to="/support" 
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                          onClick={closeAccountDropdown}
                        >
                          <HelpCircle className="h-5 w-5 text-gray-600" />
                          <span className="font-medium">Help & Support</span>
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 pt-2">
                        <button 
                          onClick={handleLogout}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 transition-colors duration-200 w-full text-left"
                        >
                          <LogOut className="h-5 w-5 text-red-600" />
                          <span className="font-medium text-red-600">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Desktop Sign In */}
            {!isAuthenticated && (
              <Link to="/login" className="hidden md:flex flex-col items-center text-xs hover:text-green-600 transition-all duration-200 group">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">Sign In</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Bar - Slide Down */}
        {showSearch && (
          <div className="mt-4 md:hidden animate-in slide-in-from-top-2 duration-300">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for fresh vegetables, fruits, dairy products..."
                className="w-full pl-4 pr-16 py-3 border-2 border-green-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300"
                autoFocus
              />
              <div className="absolute right-2 top-1.5 flex items-center space-x-1">
                <Button 
                  className="h-8 w-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  size="sm"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(false)}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Navigation Bar */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white shadow-lg">
        <div className="px-4">
          <div className="flex items-center space-x-2 py-3 overflow-x-auto scrollbar-hide">
            <Link to="/categories" className="flex items-center space-x-2 hover:bg-white/20 px-2 py-2 rounded-lg transition-all duration-200 font-medium whitespace-nowrap flex-shrink-0">
              <Menu className="h-4 w-4" />
              <span className="hidden sm:inline">All Categories</span>
              <span className="sm:hidden">Categories</span>
            </Link>
            
            <Link to="/marketplace" className="hover:bg-white/20 px-2 py-2 rounded-lg transition-all duration-200 font-medium whitespace-nowrap flex-shrink-0">
              <span className="hidden sm:inline">🛍️ Marketplace</span>
              <span className="sm:hidden">🛍️ Market</span>
            </Link>

            <Link to="/deals" className="hover:bg-white/20 px-2 py-2 rounded-lg transition-all duration-200 font-medium whitespace-nowrap bg-yellow-500/20 flex-shrink-0">
              <span className="hidden sm:inline">🔥 Today's Deals</span>
              <span className="sm:hidden">🔥 Deals</span>
            </Link>
            <Link to="/farmers" className="hover:bg-white/20 px-2 py-2 rounded-lg transition-all duration-200 font-medium whitespace-nowrap flex-shrink-0">
              <span className="hidden sm:inline">👨‍🌾 Local Farmers</span>
              <span className="sm:hidden">👨‍🌾 Farmers</span>
            </Link>
            
            {isAuthenticated && user?.role === 'farmer' && (
              <Link to="/add-product" className="hover:bg-white/20 px-2 py-2 rounded-lg transition-all duration-200 font-medium whitespace-nowrap bg-green-500/30 flex-shrink-0">
                <span className="hidden sm:inline">📦 Sell Products</span>
                <span className="sm:hidden">📦 Sell</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 sm:hidden">
        <div className="flex items-center justify-around py-2">
          <Link to="/" className="flex flex-col items-center p-2 touch-target">
            <Home className="h-5 w-5 text-gray-600" />
            <span className="text-xs text-gray-600 mt-1">Home</span>
          </Link>
          
          <Link to="/marketplace" className="flex flex-col items-center p-2 touch-target">
            <Package className="h-5 w-5 text-gray-600" />
            <span className="text-xs text-gray-600 mt-1">Shop</span>
          </Link>
          
          <Link to="/cart" className="flex flex-col items-center p-2 touch-target relative">
            <ShoppingCart className="h-5 w-5 text-gray-600" />
            <span className="text-xs text-gray-600 mt-1">Cart</span>
            {getTotalItems() > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white min-w-[16px] h-4 flex items-center justify-center text-xs font-bold">
                {getTotalItems()}
              </Badge>
            )}
          </Link>
          
          <Link to={user?.role === 'admin' ? '/admin/orders' : '/orders'} className="flex flex-col items-center p-2 touch-target">
            <Package className="h-5 w-5 text-gray-600" />
            <span className="text-xs text-gray-600 mt-1">Orders</span>
          </Link>
          
          <Link to="/profile" className="flex flex-col items-center p-2 touch-target">
            <User className="h-5 w-5 text-gray-600" />
            <span className="text-xs text-gray-600 mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Header;
