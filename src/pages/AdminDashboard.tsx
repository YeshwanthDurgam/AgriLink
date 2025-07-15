import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Shield,
  MessageSquare,
  Settings,
  Bell,
  Database,
  Cpu,
  HardDrive
} from 'lucide-react';
import { toast } from 'sonner';
import AdminQualityControl from '@/components/AdminQualityControl';
import AdminCommunication from '@/components/AdminCommunication';
import AdminUserManagement from '@/components/AdminUserManagement';
import AdminOrderManagement from '@/components/AdminOrderManagement';
import AdminAnalytics from '@/components/AdminAnalytics';
import { apiService } from '@/lib/api';
import { RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getPrimaryImageUrl } from '@/lib/utils';

interface DashboardStats {
  users: {
    total: number;
    farmers: number;
    buyers: number;
    newThisMonth: number;
  };
  products: {
    total: number;
    active: number;
    pending: number;
  };
  orders: {
    total: number;
    thisMonth: number;
    thisWeek: number;
  };
  quality: {
    totalFlags: number;
    pendingFlags: number;
  };
  announcements: {
    total: number;
    active: number;
  };
}

interface SystemHealth {
  database: {
    status: string;
    connectionState: number;
  };
  performance: {
    recentActions: number;
    recentErrors: number;
    errorRate: number;
  };
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  uptime: {
    process: number;
    server: string;
  };
}

const AdminDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Fetch dashboard stats
      const statsResponse = await apiService.get('/admin/analytics/dashboard-stats');
      if (statsResponse.success) {
        setDashboardStats(statsResponse.data);
      }
      
      // Fetch system health
      const healthResponse = await apiService.get('/admin/analytics/system-health');
      if (healthResponse.success) {
        setSystemHealth(healthResponse.data);
      }
      
      // Fetch pending products
      const productsResponse = await apiService.get('/admin/produce/pending');
      if (productsResponse.success) {
        setPendingProducts(productsResponse.data.docs || []);
      }
      
      // Fetch notifications
      const notificationsResponse = await apiService.get('/admin/communication/notifications');
      if (notificationsResponse.success) {
        setNotifications(notificationsResponse.data || []);
      }
      
      // Fetch recent activity
      const activityResponse = await apiService.get('/admin/analytics/user-activity?period=24h');
      if (activityResponse.success) {
        setRecentActivity(activityResponse.data || []);
      }
      
      // Fetch top products
      const topProductsResponse = await apiService.get('/admin/analytics/top-products?limit=5');
      if (topProductsResponse.success) {
        setTopProducts(topProductsResponse.data || []);
      }
      
      if (isRefresh) {
        toast.success('Dashboard refreshed successfully');
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time refresh every 30 seconds
    const interval = setInterval(() => fetchDashboardData(), 30000);

    return () => clearInterval(interval);
  }, []);

  const handleApproveProduct = async (productId: string) => {
    try {
      await apiService.post(`/admin/produce/${productId}/approve`, {
        notes: 'Approved by admin',
        qualityScore: 8
      });
      
      setPendingProducts(prev => prev.filter(p => p._id !== productId));
      toast.success('Product approved successfully!');
    } catch (error) {
      toast.error('Failed to approve product');
    }
  };

  const handleRejectProduct = async (productId: string) => {
    try {
      await apiService.post(`/admin/produce/${productId}/reject`, {
        reason: 'Quality standards not met',
        notes: 'Rejected by admin'
      });
      
      setPendingProducts(prev => prev.filter(p => p._id !== productId));
      toast.success('Product rejected and farmer notified.');
    } catch (error) {
      toast.error('Failed to reject product');
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage the AgriDirect platform and ensure quality standards</p>
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.users.farmers}</div>
              <p className="text-xs text-green-600">+{dashboardStats.users.newThisMonth} this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Buyers</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.users.buyers}</div>
              <p className="text-xs text-green-600">+{dashboardStats.users.newThisMonth} this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.products.active}</div>
              <p className="text-xs text-green-600">{dashboardStats.products.pending} pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.orders.total}</div>
              <p className="text-xs text-green-600">{dashboardStats.orders.thisWeek} this week</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-time Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.length > 0 ? (
                  topProducts.map((product, index) => (
                    <div key={product._id || index} className="flex items-center gap-3 p-2 border rounded">
                      <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{product.orders || 0}</p>
                        <p className="text-xs text-gray-500">orders</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No products yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Quality Metrics */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 text-center">
              <Flag className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-800">{dashboardStats.quality.totalFlags}</div>
              <p className="text-sm text-yellow-700">Quality Flags</p>
            </CardContent>
          </Card>
          
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-800">{dashboardStats.quality.pendingFlags}</div>
              <p className="text-sm text-red-700">Pending Flags</p>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-800">{dashboardStats.announcements.active}</div>
              <p className="text-sm text-green-700">Active Announcements</p>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-800">4.6</div>
              <p className="text-sm text-blue-700">Avg Platform Rating</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Health Overview */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <Database className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-800">
                {systemHealth.database.status === 'connected' ? '✓' : '✗'}
              </div>
              <p className="text-sm text-green-700">Database</p>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center">
              <Cpu className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-800">{systemHealth.performance.errorRate}%</div>
              <p className="text-sm text-blue-700">Error Rate</p>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4 text-center">
              <HardDrive className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-800">{systemHealth.memory.heapUsed}MB</div>
              <p className="text-sm text-purple-700">Memory Used</p>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-800">
                {formatUptime(systemHealth.uptime.process)}
              </div>
              <p className="text-sm text-orange-700">Uptime</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Review Modal and other dialogs remain as before */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-2xl">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>Review Product</DialogTitle>
                <DialogDescription>
                  Review all details before approving or rejecting this product.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-6 mt-2">
                <img
                  src={getPrimaryImageUrl(selectedProduct.images)}
                  alt={selectedProduct.name}
                  className="w-32 h-32 object-cover rounded-lg border"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
                <div className="flex-1 space-y-2">
                  <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
                  <div className="text-gray-600">{selectedProduct.description}</div>
                  <div className="flex gap-2 text-sm text-gray-500">
                    <span>Category: {selectedProduct.category}</span>
                    <span>• Unit: {selectedProduct.unit}</span>
                    <span>• Price: ₹{selectedProduct.basePrice || selectedProduct.price}/{selectedProduct.unit}</span>
                  </div>
                  <div className="flex gap-2 text-sm text-gray-500">
                    <span>Quantity: {selectedProduct.quantity} {selectedProduct.unit}s</span>
                    <span>• Min Order: {selectedProduct.minOrderQuantity}</span>
                    {selectedProduct.maxOrderQuantity && <span>• Max Order: {selectedProduct.maxOrderQuantity}</span>}
                  </div>
                  <div className="flex gap-2 text-sm text-gray-500">
                    <span>Organic: {selectedProduct.organic ? 'Yes' : 'No'}</span>
                    <span>• Grade: {selectedProduct.qualityGrade}</span>
                    <span>• Certifications: {selectedProduct.certifications?.join(', ') || 'None'}</span>
                  </div>
                  <div className="flex gap-2 text-sm text-gray-500">
                    <span>Harvest: {selectedProduct.harvestDate ? new Date(selectedProduct.harvestDate).toLocaleDateString() : 'N/A'}</span>
                    <span>• Expiry: {selectedProduct.expiryDate ? new Date(selectedProduct.expiryDate).toLocaleDateString() : 'N/A'}</span>
                    <span>• Shelf Life: {selectedProduct.shelfLife ? selectedProduct.shelfLife + ' days' : 'N/A'}</span>
                  </div>
                  <div className="flex gap-2 text-sm text-gray-500">
                    <span>Farm: {selectedProduct.farmName || 'N/A'}</span>
                    <span>• Location: {selectedProduct.farmLocation || 'N/A'}</span>
                  </div>
                  <div className="flex gap-2 text-sm text-gray-500">
                    <span>Tags: {selectedProduct.tags?.join(', ') || 'None'}</span>
                  </div>
                  <div className="flex gap-2 text-sm text-gray-500">
                    <span>Submitted: {selectedProduct.createdAt ? new Date(selectedProduct.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex gap-2 text-sm text-gray-500">
                    <span>Farmer: {selectedProduct.farmer?.name || 'Unknown'}</span>
                    <span>• Verified: {selectedProduct.farmer?.verificationStatus === 'verified' ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6 flex gap-2 justify-end">
                <AlertDialog open={confirmApproveOpen} onOpenChange={setConfirmApproveOpen}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setConfirmApproveOpen(true)}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Approve Product?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to approve this product? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          await handleApproveProduct(selectedProduct._id);
                          setReviewModalOpen(false);
                          setConfirmApproveOpen(false);
                        }}
                      >
                        Approve
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog open={confirmRejectOpen} onOpenChange={setConfirmRejectOpen}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setConfirmRejectOpen(true)}
                    >
                      <ThumbsDown className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject Product?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to reject this product? This action cannot be undone and the farmer will be notified.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          await handleRejectProduct(selectedProduct._id);
                          setReviewModalOpen(false);
                          setConfirmRejectOpen(false);
                        }}
                      >
                        Reject
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <DialogClose asChild>
                  <Button variant="outline" size="sm">Close</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
