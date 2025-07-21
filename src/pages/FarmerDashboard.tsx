import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  IndianRupee,
  Plus,
  Eye,
  Edit,
  AlertCircle,
  Star,
  Users,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Package2,
  Truck,
  MessageSquare,
  Settings,
  Bell,
  Download,
  Filter,
  Send
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';
import { useRef } from 'react';

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  senderRole: string;
  receiverRole: string;
  content: string;
  createdAt: string;
}

const ADMIN_ID = "686908204944785133a50bbc";

const FarmerDashboard = () => {
  const { user } = useAuth();
  
  // Mock data - in real app, this would come from API
  const [dashboardData] = useState({
    stats: {
      totalProducts: 12,
      activeOrders: 8,
      monthlyRevenue: 25600,
      averageRating: 4.7,
      totalCustomers: 45,
      pendingDeliveries: 3,
      lowStockItems: 2,
      thisWeekOrders: 15
    },
    revenueData: {
      thisWeek: 8500,
      lastWeek: 7200,
      thisMonth: 25600,
      lastMonth: 22400
    },
    recentProducts: [
      {
        id: '1',
        name: 'Organic Tomatoes',
        category: 'Vegetables',
        price: 45,
        quantity: 150,
        status: 'active',
        orders: 23,
        rating: 4.8,
        image: '🍅'
      },
      {
        id: '2',
        name: 'Fresh Spinach',
        category: 'Vegetables',
        price: 30,
        quantity: 0,
        status: 'out_of_stock',
        orders: 15,
        rating: 4.6,
        image: '🥬'
      },
      {
        id: '3',
        name: 'Wheat Seeds',
        category: 'Seeds',
        price: 85,
        quantity: 200,
        status: 'pending_approval',
        orders: 0,
        rating: 0,
        image: '🌾'
      },
      {
        id: '4',
        name: 'Fresh Milk',
        category: 'Dairy',
        price: 60,
        quantity: 50,
        status: 'active',
        orders: 8,
        rating: 4.9,
        image: '🥛'
      }
    ],
    recentOrders: [
      {
        id: 'ORD001',
        product: 'Organic Tomatoes',
        buyer: 'Raj Restaurant',
        quantity: 25,
        amount: 1125,
        status: 'confirmed',
        date: '2024-06-26',
        deliveryDate: '2024-06-28',
        priority: 'high'
      },
      {
        id: 'ORD002',
        product: 'Fresh Spinach',
        buyer: 'Green Grocers',
        quantity: 10,
        amount: 300,
        status: 'delivered',
        date: '2024-06-25',
        deliveryDate: '2024-06-27',
        priority: 'medium'
      },
      {
        id: 'ORD003',
        product: 'Fresh Milk',
        buyer: 'Daily Dairy',
        quantity: 15,
        amount: 900,
        status: 'pending',
        date: '2024-06-26',
        deliveryDate: '2024-06-29',
        priority: 'low'
      }
    ],
    topProducts: [
      { name: 'Organic Tomatoes', sales: 1250, growth: 12 },
      { name: 'Fresh Spinach', sales: 890, growth: -5 },
      { name: 'Fresh Milk', sales: 720, growth: 8 },
      { name: 'Wheat Seeds', sales: 450, growth: 15 }
    ],
    alerts: [
      { type: 'stock', message: 'Fresh Spinach is out of stock', priority: 'high' },
      { type: 'order', message: 'New order received from Raj Restaurant', priority: 'medium' },
      { type: 'delivery', message: 'Delivery scheduled for tomorrow', priority: 'low' }
    ]
  });

  // Messaging state for farmer
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);

  // Fetch messages with admin
  useEffect(() => {
    if (user?.id) {
      fetchMessages();
    }
  }, [user]);

  // Scroll to bottom when messages change or tab is opened
  useEffect(() => {
    if (activeTab === 'messaging' && messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const fetchMessages = async () => {
    if (!user?.id) return; // Prevent API call if user is not loaded
    setLoadingMessages(true);
    try {
      const res = await apiService.get(`/messages?userId=${user.id}&partnerId=${ADMIN_ID}`);
      setMessages(res.data?.docs || res.data || []);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user?.id || !messageInput.trim()) return;
    try {
      await apiService.post('/messages', {
        senderId: user.id,
        receiverId: ADMIN_ID,
        senderRole: 'Farmer',
        receiverRole: 'Admin',
        content: messageInput.trim(),
      });
      setMessageInput('');
      fetchMessages();
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>;
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{priority}</Badge>;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'stock':
        return <Package2 className="w-4 h-4" />;
      case 'order':
        return <ShoppingCart className="w-4 h-4" />;
      case 'delivery':
        return <Truck className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const TAB_KEY = 'farmerDashboardActiveTab';
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem(TAB_KEY) || 'overview');
  useEffect(() => {
    localStorage.setItem(TAB_KEY, activeTab);
  }, [activeTab]);

  // Check if there are unread messages
  const hasUnreadMessages = messages.some(msg => msg.sender !== user?.id);

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-6 md:px-8 md:py-8 rounded-b-2xl" style={{background: 'linear-gradient(90deg, #e0ffe0 0%, #f8fafc 100%)'}}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Farmer Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name}! Here's your farm's performance overview.</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Link to="/add-product">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Product
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 md:px-0 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <IndianRupee className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{dashboardData.stats.monthlyRevenue.toLocaleString()}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +14.3% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Products</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.totalProducts}</div>
              <div className="flex items-center text-xs text-blue-600 mt-1">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +2 new products
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Orders</CardTitle>
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.activeOrders}</div>
              <div className="flex items-center text-xs text-orange-600 mt-1">
                <Clock className="w-3 h-3 mr-1" />
                {dashboardData.stats.pendingDeliveries} to deliver
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Customer Rating</CardTitle>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Star className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.averageRating}</div>
              <div className="flex items-center text-xs text-purple-600 mt-1">
                <Users className="w-3 h-3 mr-1" />
                {dashboardData.stats.totalCustomers} customers
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="messaging">
              Messages
              {hasUnreadMessages && <span className="inline-block w-2 h-2 bg-red-500 rounded-full ml-2"></span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Orders */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Recent Orders</CardTitle>
                    <Link to="/orders">
                      <Button variant="outline" size="sm">View All</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{order.id}</h4>
                            {getStatusBadge(order.status)}
                            {getPriorityBadge(order.priority)}
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            {order.product} • {order.buyer}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {order.quantity} kg
                            </span>
                            <span className="flex items-center gap-1">
                              <IndianRupee className="w-3 h-3" />
                              {order.amount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(order.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Alerts & Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Alerts & Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.alerts.map((alert, index) => (
                      <div key={index} className={`p-3 rounded-lg border-l-4 ${
                        alert.priority === 'high' ? 'border-red-500 bg-red-50' :
                        alert.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                        'border-green-500 bg-green-50'
                      }`}>
                        <div className="flex items-start gap-2">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{alert.message}</p>
                            <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Market Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Market Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-800">High Demand</h4>
                    </div>
                    <p className="text-sm text-green-700">Organic vegetables are trending 15% above average. Consider increasing production.</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-800">Price Alert</h4>
                    </div>
                    <p className="text-sm text-blue-700">Tomato prices are 8% higher than regional average. Good time to sell!</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-5 w-5 text-orange-600" />
                      <h4 className="font-semibold text-orange-800">Seasonal Tip</h4>
                    </div>
                    <p className="text-sm text-orange-700">Consider planting monsoon crops for July harvest. Market demand expected to rise.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>My Products</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Link to="/add-product">
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardData.recentProducts.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-2xl">{product.image}</div>
                        {getStatusBadge(product.status)}
                      </div>
                      <h4 className="font-semibold mb-2">{product.name}</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Price:</span>
                          <span className="font-medium">₹{product.price}/kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Stock:</span>
                          <span className={product.quantity === 0 ? 'text-red-600 font-medium' : 'font-medium'}>
                            {product.quantity} kg
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Orders:</span>
                          <span className="font-medium">{product.orders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rating:</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="font-medium">{product.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.recentOrders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{order.id}</h4>
                              {getStatusBadge(order.status)}
                              {getPriorityBadge(order.priority)}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">₹{order.amount}</div>
                              <div className="text-sm text-gray-500">{order.quantity} kg</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Product:</span>
                              <div className="font-medium">{order.product}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Buyer:</span>
                              <div className="font-medium">{order.buyer}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Order Date:</span>
                              <div className="font-medium">{new Date(order.date).toLocaleDateString()}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Delivery Date:</span>
                              <div className="font-medium">{new Date(order.deliveryDate).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" className="flex-1">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirm
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Truck className="w-4 h-4 mr-1" />
                              Schedule Delivery
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Order Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-green-800">Confirmed</div>
                        <div className="text-sm text-green-600">5 orders</div>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-yellow-800">Pending</div>
                        <div className="text-sm text-yellow-600">3 orders</div>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-blue-800">Delivered</div>
                        <div className="text-sm text-blue-600">12 orders</div>
                      </div>
                      <Truck className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="messaging" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Message Admin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={messageListRef} className="bg-gray-50 p-2 rounded mb-2 overflow-y-auto" style={{ height: 300 }}>
                  {loadingMessages ? (
                    <div>Loading...</div>
                  ) : (
                    <ul className="space-y-2">
                      {messages.map(msg => {
                        const isSent = msg.sender === user.id;
                        return (
                          <li key={msg._id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-2 rounded-2xl max-w-[70%] shadow ${isSent ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-900'}`}
                              style={{ borderBottomRightRadius: isSent ? 0 : '1rem', borderBottomLeftRadius: isSent ? '1rem' : 0 }}>
                              <span className="block text-sm break-words">{msg.content}</span>
                              <span className={`block text-xs mt-1 ${isSent ? 'text-green-100' : 'text-gray-500'} text-right`}>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    placeholder="Type your message to admin..."
                    onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                    disabled={!user?.id}
                  />
                  <Button onClick={handleSendMessage} disabled={!user?.id || !messageInput.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                  {!user?.id && (
                    <div className="text-red-500 text-sm mt-2">
                      Please log in to send messages.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-semibold text-green-600">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">₹{product.sales} sales</div>
                          </div>
                        </div>
                        <div className={`flex items-center text-sm ${
                          product.growth > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {product.growth > 0 ? (
                            <ArrowUpRight className="w-4 h-4 mr-1" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 mr-1" />
                          )}
                          {Math.abs(product.growth)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <div>
                        <div className="text-sm text-gray-600">This Week</div>
                        <div className="font-semibold text-lg">₹{dashboardData.revenueData.thisWeek.toLocaleString()}</div>
                      </div>
                      <div className="text-green-600 text-sm">
                        +18% from last week
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <div>
                        <div className="text-sm text-gray-600">This Month</div>
                        <div className="font-semibold text-lg">₹{dashboardData.revenueData.thisMonth.toLocaleString()}</div>
                      </div>
                      <div className="text-blue-600 text-sm">
                        +14% from last month
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FarmerDashboard;
