
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, MapPin, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';

interface Order {
  id: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
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

  // Fetch orders using React Query
  const {
    data: ordersData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['orders', activeTab],
    queryFn: () => apiService.getUserOrders(1, 50, activeTab === 'all' ? undefined : activeTab),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
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
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'shipped': return <Package className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const filterOrdersByStatus = (status?: string) => {
    if (!status || status === 'all') return orders;
    return orders.filter(order => order.orderStatus === status);
  };

  const OrderCard = ({ order }: { order: any }) => (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">Order #{order.orderNumber}</h3>
            <p className="text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <Badge className={getStatusColor(order.orderStatus)}>
            {getStatusIcon(order.orderStatus)}
            <span className="ml-1 capitalize">{order.orderStatus}</span>
          </Badge>
        </div>

        <div className="space-y-3 mb-4">
          {order.items.map((item: any, index: number) => (
            <div key={index} className="flex justify-between items-center">
              <div>
                <div className="font-medium">{item.name}</div>
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
              {order.deliveryAddress.city}, {order.deliveryAddress.state}
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
        
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
            {filterOrdersByStatus('pending').map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </TabsContent>
          
          <TabsContent value="shipped">
            {filterOrdersByStatus('shipped').map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </TabsContent>
          
          <TabsContent value="delivered">
            {filterOrdersByStatus('delivered').map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </TabsContent>
          
          <TabsContent value="cancelled">
            {filterOrdersByStatus('cancelled').map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Orders;
