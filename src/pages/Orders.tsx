
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, MapPin, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Order {
  id: string;
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'processing' | 'out_for_delivery' | 'returned';
  total: number;
  orderDate: string;
  expectedDelivery: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    price: number;
    farmer: {
      name: string;
      location: string;
    };
  }>;
  deliveryAddress: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
}

const Orders = () => {
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useAuth();

  // Fetch orders using React Query
  const {
    data: ordersData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['orders', activeTab, user?.role],
    queryFn: () => {
      if (user?.role === 'farmer') {
        return apiService.getFarmerOrders(1, 50, activeTab === 'all' ? undefined : activeTab);
      } else {
        return apiService.getUserOrders(1, 50, activeTab === 'all' ? undefined : activeTab);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: !!user, // Only fetch if user is available
  });

  const orders = ordersData?.orders || [];

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error('Failed to load orders. Please try again.');
    }
  }, [error]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-orange-100 text-orange-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery': return 'bg-teal-100 text-teal-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'returned': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'shipped': return <Package className="w-4 h-4" />;
      case 'out_for_delivery': return <MapPin className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'returned': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const OrderCard = ({ order }: { order: any }) => (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">Order #{order.orderNumber || order._id}</h3>
            <p className="text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <Badge className={getStatusColor(order.orderStatus)}>
            {getStatusIcon(order.orderStatus)}
            <span className="ml-1 capitalize">{(order.orderStatus || 'unknown').replace(/_/g, ' ')}</span>
          </Badge>
        </div>

        <div className="space-y-3 mb-4">
          {order.items.filter(item => item && item.product).map((item: any, index: number) => (
            <div key={item.product._id || index} className="flex justify-between items-center">
              <div>
                <div className="font-medium">{item.name || item.product.name}</div>
                <div className="text-sm text-gray-500">
                  {item.quantity} {item.unit} × ₹{item.price} - by {item.farmerName}
                </div>
              </div>
              <div className="font-medium">
                ₹{item.total.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {order.deliveryAddress && order.deliveryAddress.city && order.deliveryAddress.state && 
               `${order.deliveryAddress.city}, ${order.deliveryAddress.state}` || 
               'Delivery address not specified'}
            </div>
            {order.expectedDelivery && (
              <div className="text-green-600 mt-1">
                Expected delivery: {new Date(order.expectedDelivery).toLocaleDateString()}
              </div>
            )}
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold">Total: ₹{order.total.toFixed(2)}</div>
            <Button variant="outline" size="sm" className="mt-2">
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageHeader title="My Orders" description="Track and manage your recent purchases" />
        
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
                  <p className="text-gray-600">Loading orders...</p>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600">You haven't placed any orders yet.</p>
              </div>
            ) : (
              orders.map((order) => (
                <OrderCard key={order._id} order={order} />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="pending">
            {orders.filter(order => order.orderStatus === 'pending').map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </TabsContent>
          
          <TabsContent value="shipped">
            {orders.filter(order => order.orderStatus === 'shipped').map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </TabsContent>
          
          <TabsContent value="delivered">
            {orders.filter(order => order.orderStatus === 'delivered').map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </TabsContent>
          
          <TabsContent value="cancelled">
            {orders.filter(order => order.orderStatus === 'cancelled').map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Orders;
