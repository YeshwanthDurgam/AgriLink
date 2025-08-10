import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  Package, 
  IndianRupee, 
  Star, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Download,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';

interface AnalyticsData {
  platformGrowth: {
    newFarmers: number;
    newBuyers: number;
    totalProducts: number;
    qualityScore: number;
  };
  qualityMetrics: {
    totalFlags: number;
    pendingFlags: number;
    activeAnnouncements: number;
    systemHealth: string;
  };
  topProducts: Array<{
    _id: string;
    name: string;
    category: string;
    orders: number;
    revenue: number;
    rating: number;
  }>;
  cropSeasons: Array<{
    _id: {
      startMonth: number;
      endMonth: number;
    };
    products: Array<{
      name: string;
      category: string;
      farmer: string;
      region: string;
    }>;
    count: number;
  }>;
  userActivity: Array<{
    action: string;
    timestamp: string;
    user: string;
    details: string;
  }>;
  revenueData: {
    total: number;
    thisMonth: number;
    thisWeek: number;
    growth: number;
  };
}

const AdminAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalyticsData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      // Fetch all analytics data
      const [topProductsRes, cropSeasonsRes, userActivityRes, dashboardStatsRes, systemHealthRes] = await Promise.all([
        apiService.get('/admin/analytics/top-products?limit=10'),
        apiService.get('/admin/analytics/crop-seasons'),
        apiService.get('/admin/analytics/user-activity?period=7d'),
        apiService.get('/admin/analytics/dashboard-stats'),
        apiService.get('/admin/analytics/system-health')
      ]);

      // Normalize user activity into a simple list for rendering
      const normalizedActivity = Array.isArray(userActivityRes?.data?.recentAdminActions)
        ? userActivityRes.data.recentAdminActions.map((a: any) => ({
            action: a._id,
            timestamp: new Date().toISOString(),
            user: 'system',
            details: `Count: ${a.count}`
          }))
        : [];

      const data: AnalyticsData = {
        platformGrowth: {
          newFarmers: dashboardStatsRes?.success ? (dashboardStatsRes.data?.users?.newThisMonth || 0) : 0,
          newBuyers: dashboardStatsRes?.success ? (dashboardStatsRes.data?.users?.newThisMonth || 0) : 0,
          totalProducts: dashboardStatsRes?.success ? (dashboardStatsRes.data?.products?.total || 0) : 0,
          qualityScore: 4.6
        },
        qualityMetrics: {
          totalFlags: dashboardStatsRes?.success ? (dashboardStatsRes.data?.quality?.totalFlags || 0) : 0,
          pendingFlags: dashboardStatsRes?.success ? (dashboardStatsRes.data?.quality?.pendingFlags || 0) : 0,
          activeAnnouncements: dashboardStatsRes?.success ? (dashboardStatsRes.data?.announcements?.active || 0) : 0,
          systemHealth: systemHealthRes?.success ? 'Healthy' : 'Unknown'
        },
        topProducts: topProductsRes?.success ? topProductsRes.data : [],
        cropSeasons: cropSeasonsRes?.success ? cropSeasonsRes.data : [],
        userActivity: normalizedActivity,
        revenueData: {
          total: 0,
          thisMonth: 0,
          thisWeek: 0,
          growth: 12.5
        }
      };

      setAnalyticsData(data);

      if (isRefresh) {
        toast.success('Analytics refreshed successfully');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics data');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics & Reports</h2>
            <p className="text-gray-600">Comprehensive insights into platform performance</p>
          </div>
          <Button disabled>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics & Reports</h2>
            <p className="text-gray-600">Comprehensive insights into platform performance</p>
          </div>
          <Button onClick={() => fetchAnalyticsData(true)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
        <div className="text-center py-12 text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics & Reports</h2>
          <p className="text-gray-600">Comprehensive insights into platform performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={() => fetchAnalyticsData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{analyticsData?.revenueData.growth || 0}%</div>
            <p className="text-sm text-gray-600">Growth Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{analyticsData?.platformGrowth.newFarmers || 0}</div>
            <p className="text-sm text-gray-600">New Farmers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{analyticsData?.platformGrowth.totalProducts || 0}</div>
            <p className="text-sm text-gray-600">Total Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{analyticsData?.platformGrowth.qualityScore || 0}/5</div>
            <p className="text-sm text-gray-600">Quality Score</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="seasons">Crop Seasons</TabsTrigger>
          <TabsTrigger value="activity">User Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Platform Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">New Farmers</span>
                    <span className="font-semibold">+{analyticsData?.platformGrowth.newFarmers || 0} this month</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">New Buyers</span>
                    <span className="font-semibold">+{analyticsData?.platformGrowth.newBuyers || 0} this month</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Products Listed</span>
                    <span className="font-semibold">+{analyticsData?.platformGrowth.totalProducts || 0} total</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quality Score</span>
                    <span className="font-semibold text-green-600">{analyticsData?.platformGrowth.qualityScore || 0}/5 ⭐</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Quality Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quality Flags</span>
                    <span className="font-semibold text-yellow-600">{analyticsData?.qualityMetrics.totalFlags || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending Flags</span>
                    <span className="font-semibold text-red-600">{analyticsData?.qualityMetrics.pendingFlags || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Announcements</span>
                    <span className="font-semibold">{analyticsData?.qualityMetrics.activeAnnouncements || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">System Health</span>
                    <span className="font-semibold text-green-600">
                      {analyticsData?.qualityMetrics.systemHealth === 'Healthy' ? '✓ Healthy' : '✗ Issues'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Top Performing Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.topProducts?.map((product, index) => (
                  <div key={product._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-gray-500">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{product.orders} orders</div>
                      <div className="text-sm text-gray-500">{formatCurrency(product.revenue)}</div>
                       <div className="flex items-center gap-1 text-sm">
                         <Star className="w-3 h-3 text-yellow-500 fill-current" />
                         {typeof product.rating === 'number' ? product.rating.toFixed(1) : 'N/A'}
                       </div>
                    </div>
                  </div>
                ))}
                {(!analyticsData?.topProducts || analyticsData.topProducts.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>No product data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Crop Season Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.cropSeasons.map((season, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">
                        {getMonthName(season._id.startMonth)} - {getMonthName(season._id.endMonth)}
                      </h4>
                      <Badge>{season.count} products</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {season.products.slice(0, 4).map((product, pIndex) => (
                        <div key={pIndex} className="text-sm text-gray-600">
                          • {product.name} ({product.category}) - {product.region}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(!analyticsData?.cropSeasons || analyticsData.cropSeasons.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>No crop season data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent User Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.userActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-gray-500">
                        by {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                      </p>
                      {activity.details && (
                        <p className="text-xs text-gray-600 mt-1">{activity.details}</p>
                      )}
                    </div>
                  </div>
                ))}
                {(!analyticsData?.userActivity || analyticsData.userActivity.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics; 