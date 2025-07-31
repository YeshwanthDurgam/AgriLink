import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Marketplace from "./pages/Marketplace";
import ProductDetail from "./pages/ProductDetail";
import Categories from "./pages/Categories";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Order from "./pages/Order";
import Support from "./pages/Support";
import FarmerDashboard from "./pages/FarmerDashboard";
import AddProduct from "./pages/AddProduct";
import ManageProducts from "./pages/ManageProducts";
import FarmerEarnings from "./pages/FarmerEarnings";
import BuyerDashboard from "./pages/BuyerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Delivery from "./pages/Delivery";
import Deals from "./pages/Deals";
import WhatsNew from "./pages/WhatsNew";
import Farmers from "./pages/Farmers";
import FarmerDetail from "./pages/FarmerDetail";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminUserManagement from './components/AdminUserManagement';
import AdminOrderManagement from './components/AdminOrderManagement';
import AdminQualityControl from './components/AdminQualityControl';
import AdminCommunication from './components/AdminCommunication';
import AdminAnalytics from './components/AdminAnalytics';
import DashboardLayout from './components/DashboardLayout';
import CategoryPage from "./pages/CategoryPage";
import WishlistPage from "./pages/WishlistPage";

import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

function AdminPanel() {
  return (
    <DashboardLayout userRole="admin">
      <Outlet />
    </DashboardLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/category/:categoryName" element={<CategoryPage />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<Order />} />
              <Route path="/support" element={<Support />} />
              <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
              <Route path="/add-product" element={<AddProduct />} />
              <Route path="/manage-products" element={<ManageProducts />} />
              <Route path="/farmer-earnings" element={<FarmerEarnings />} />
              <Route path="/buyer-dashboard" element={<BuyerDashboard />} />
              <Route path="/admin/*" element={<AdminPanel />}>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUserManagement />} />
                <Route path="orders" element={<AdminOrderManagement />} />
                <Route path="products">
                  <Route index element={<ManageProducts />} />
                  <Route path="add" element={<AddProduct />} />
                </Route>
                <Route path="quality" element={<AdminQualityControl />} />
                <Route path="communication" element={<AdminCommunication />} />
                <Route path="analytics" element={<AdminAnalytics />} />
              </Route>
              <Route path="/delivery" element={<Delivery />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/whats-new" element={<WhatsNew />} />
              <Route path="/farmers" element={<Farmers />} />
              <Route path="/farmers/:id" element={<FarmerDetail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </Router>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
