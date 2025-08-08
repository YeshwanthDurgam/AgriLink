
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-white/90 backdrop-blur border-r border-border z-20">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold">AgriDirect</h2>
              <p className="text-xs text-muted-foreground capitalize">{userRole} Portal</p>
            </div>
          </Link>
        </div>
        <nav className="mt-4">
          <div className="px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center px-3 py-2.5 mb-1 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-green-100 text-green-700"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        <main className="min-h-screen px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
