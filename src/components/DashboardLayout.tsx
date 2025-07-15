
import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  Plus,
  ListChecks,
  TrendingUp,
  Shield,
  MessageSquare
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  userRole: 'farmer' | 'buyer' | 'admin' | 'super_admin' | 'produce_manager' | 'logistics_coordinator' | 'farmer_support' | 'communication_manager' | 'analytics_manager' | 'pricing_manager';
}

const DashboardLayout = ({ children, userRole }: DashboardLayoutProps) => {
  const location = useLocation();

  const getNavItems = () => {
    switch (userRole) {
      case 'farmer':
        return [
          { icon: Home, label: 'Dashboard', href: '/farmer-dashboard' },
          { icon: Package, label: 'My Products', href: '/farmer/products' },
          { icon: Plus, label: 'Add Product', href: '/farmer/add-product' },
          { icon: ListChecks, label: 'Orders', href: '/farmer/orders' },
          { icon: TrendingUp, label: 'Analytics', href: '/farmer/analytics' },
          { icon: Settings, label: 'Settings', href: '/farmer/settings' }
        ];
      case 'buyer':
        return [
          { icon: Home, label: 'Dashboard', href: '/buyer-dashboard' },
          { icon: ShoppingCart, label: 'My Orders', href: '/buyer/orders' },
          { icon: Package, label: 'Wishlist', href: '/buyer/wishlist' },
          { icon: Settings, label: 'Settings', href: '/buyer/settings' }
        ];
      case 'admin':
      case 'super_admin':
      case 'produce_manager':
      case 'logistics_coordinator':
      case 'farmer_support':
      case 'communication_manager':
      case 'analytics_manager':
      case 'pricing_manager':
        return [
          { icon: Home, label: 'Dashboard', href: '/admin' },
          { icon: Users, label: 'Users', href: '/admin/users' },
          { icon: Package, label: 'Products', href: '/admin/products' },
          { icon: ShoppingCart, label: 'Orders', href: '/admin/orders' },
          { icon: Shield, label: 'Quality Control', href: '/admin/quality' },
          { icon: MessageSquare, label: 'Communication', href: '/admin/communication' },
          { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
          { icon: Settings, label: 'System', href: '/admin/system' }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-full w-64 bg-white shadow-sm border-r border-gray-200 z-20">
        <div className="p-6 border-b border-gray-200">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AgriDirect</h2>
              <p className="text-sm text-gray-500 capitalize">{userRole} Portal</p>
            </div>
          </Link>
        </div>
        <nav className="mt-6">
          <div className="px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 mb-1 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-green-100 text-green-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 h-full flex flex-col">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
