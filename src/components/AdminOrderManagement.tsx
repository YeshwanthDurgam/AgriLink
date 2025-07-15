import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee,
  MapPin,
  User,
  Calendar,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface Order {
  _id: string;
  orderId: string;
  buyer: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  farmer: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    product: {
      _id: string;
      name: string;
      price: number;
      unit: string;
    };
    quantity: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'disputed';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  deliveryAddress: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  deliveryPartner?: {
    _id: string;
    name: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  dispute?: {
    reason: string;
    description: string;
    status: 'open' | 'resolved' | 'closed';
    createdAt: string;
  };
}

const AdminOrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | Order['paymentStatus']>('all');
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({
    deliveryAddress: { fullName: '', address: '', city: '', state: '', pincode: '' },
    estimatedDelivery: '',
    status: '' as Order['status'],
    paymentStatus: '' as Order['paymentStatus'],
  });
  const [editLoading, setEditLoading] = useState(false);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiService.get('/admin/orders?page=1&limit=50');
        if (res.success) {
          setOrders(res.data.docs || []);
        } else {
          setError(res.message || 'Failed to fetch orders');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleOrderAction = async (orderId: string, action: 'confirm' | 'ship' | 'deliver' | 'cancel' | 'assign-delivery') => {
    try {
      const endpoint = `/admin/orders/${orderId}/${action}`;
      await apiService.post(endpoint);
      
      // Update local state
      setOrders(prev => prev.map(order => {
        if (order._id === orderId) {
          let newStatus = order.status;
          if (action === 'confirm') newStatus = 'confirmed';
          if (action === 'ship') newStatus = 'shipped';
          if (action === 'deliver') newStatus = 'delivered';
          if (action === 'cancel') newStatus = 'cancelled';
          
          return { ...order, status: newStatus };
        }
        return order;
      }));
      
      toast.success(`Order ${action}ed successfully`);
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  const handleDisputeAction = async (orderId: string, action: 'resolve' | 'close') => {
    try {
      const endpoint = `/admin/orders/${orderId}/dispute/${action}`;
      await apiService.post(endpoint);
      
      // Update local state
      setOrders(prev => prev.map(order => {
        if (order._id === orderId && order.dispute) {
          return {
            ...order,
            dispute: { ...order.dispute, status: action === 'resolve' ? 'resolved' : 'closed' }
          };
        }
        return order;
      }));
      
      toast.success(`Dispute ${action}d successfully`);
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  const openEditModal = (order: Order) => {
    setEditOrder(order);
    setEditForm({
      deliveryAddress: { ...order.deliveryAddress },
      estimatedDelivery: order.estimatedDelivery || '',
      status: order.status,
      paymentStatus: order.paymentStatus,
    });
  };

  const closeEditModal = () => {
    setEditOrder(null);
    setEditForm({
      deliveryAddress: { fullName: '', address: '', city: '', state: '', pincode: '' },
      estimatedDelivery: '',
      status: '' as Order['status'],
      paymentStatus: '' as Order['paymentStatus'],
    });
    setEditLoading(false);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('deliveryAddress.')) {
      const field = name.split('.')[1];
      setEditForm(prev => ({ ...prev, deliveryAddress: { ...prev.deliveryAddress, [field]: value } }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSave = async () => {
    if (!editOrder) return;
    setEditLoading(true);
    try {
      const endpoint = `/admin/orders/${editOrder._id}`;
      const res = await apiService.put(endpoint, editForm);
      if (res.success) {
        toast.success('Order updated successfully');
        setOrders(orders => orders.map(o => o._id === editOrder._id ? { ...o, ...editForm, deliveryAddress: { ...editForm.deliveryAddress } } : o));
        closeEditModal();
      } else {
        toast.error(res.message || 'Failed to update order');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order');
    } finally {
      setEditLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.farmer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'disputed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">#{order.orderId}</h3>
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
            <Badge className={getPaymentStatusColor(order.paymentStatus)}>
              {order.paymentStatus}
            </Badge>
            {order.dispute && (
              <Badge className="bg-red-100 text-red-800">
                Disputed
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-sm font-medium mb-1">Buyer</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                {order.buyer.name}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Farmer</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                {order.farmer.name}
              </div>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-sm font-medium mb-1">Items</p>
            <div className="space-y-1">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.product.name} x {item.quantity} {item.product.unit}</span>
                  <span>₹{item.totalPrice}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <IndianRupee className="w-4 h-4" />
              <span className="font-medium">₹{order.totalAmount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              {new Date(order.createdAt).toLocaleDateString()}
            </div>
          </div>

          {order.deliveryAddress && (
            <div className="mb-3">
              <p className="text-sm font-medium mb-1">Delivery Address</p>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>
                  {order.deliveryAddress.fullName}, {order.deliveryAddress.address}, 
                  {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                </span>
              </div>
            </div>
          )}

          {order.dispute && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm font-medium text-red-800 mb-1">Dispute</p>
              <p className="text-sm text-red-700">{order.dispute.reason}</p>
              <p className="text-xs text-red-600 mt-1">{order.dispute.description}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openEditModal(order)}>
            <MoreHorizontal className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {order.status === 'pending' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOrderAction(order._id, 'confirm')}
            className="text-blue-600 hover:text-blue-700"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Confirm
          </Button>
        )}
        
        {order.status === 'confirmed' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOrderAction(order._id, 'ship')}
            className="text-indigo-600 hover:text-indigo-700"
          >
            <Truck className="w-4 h-4 mr-1" />
            Ship
          </Button>
        )}
        
        {order.status === 'shipped' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOrderAction(order._id, 'deliver')}
            className="text-green-600 hover:text-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Mark Delivered
          </Button>
        )}
        
        {['pending', 'confirmed'].includes(order.status) && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOrderAction(order._id, 'cancel')}
            className="text-red-600 hover:text-red-700"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        )}
        
        {!order.deliveryPartner && ['confirmed', 'processing'].includes(order.status) && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOrderAction(order._id, 'assign-delivery')}
            className="text-purple-600 hover:text-purple-700"
          >
            <Truck className="w-4 h-4 mr-1" />
            Assign Delivery
          </Button>
        )}
        
        {order.dispute && order.dispute.status === 'open' && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDisputeAction(order._id, 'resolve')}
              className="text-green-600 hover:text-green-700"
            >
              <Shield className="w-4 h-4 mr-1" />
              Resolve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDisputeAction(order._id, 'close')}
              className="text-gray-600 hover:text-gray-700"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Close
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    disputed: orders.filter(o => o.dispute && o.dispute.status === 'open').length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0)
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Management</h2>
        <p className="text-gray-600">Monitor orders, manage delivery, and resolve disputes</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-gray-600">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.delivered}</div>
            <p className="text-sm text-gray-600">Delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.disputed}</div>
            <p className="text-sm text-gray-600">Disputes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <IndianRupee className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-sm text-gray-600">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="active">Active ({stats.confirmed + stats.shipped})</TabsTrigger>
          <TabsTrigger value="disputes">Disputes ({stats.disputed})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="border rounded-md px-3 py-2"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="disputed">Disputed</option>
                </select>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as any)}
                  className="border rounded-md px-3 py-2"
                >
                  <option value="all">All Payments</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading orders...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <OrderCard key={order._id} order={order} />
                  ))}
                  {filteredOrders.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p>No orders found</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.filter(o => o.status === 'pending').map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))}
                {orders.filter(o => o.status === 'pending').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p>No pending orders</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.status)).map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))}
                {orders.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.status)).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>No active orders</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Disputed Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.filter(o => o.dispute && o.dispute.status === 'open').map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))}
                {orders.filter(o => o.dispute && o.dispute.status === 'open').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p>No open disputes</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editOrder} onOpenChange={v => !v && closeEditModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>Modify order details and save changes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Recipient Name</label>
              <input name="deliveryAddress.fullName" value={editForm.deliveryAddress.fullName} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Address</label>
              <input name="deliveryAddress.address" value={editForm.deliveryAddress.address} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">City</label>
              <input name="deliveryAddress.city" value={editForm.deliveryAddress.city} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">State</label>
              <input name="deliveryAddress.state" value={editForm.deliveryAddress.state} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Pincode</label>
              <input name="deliveryAddress.pincode" value={editForm.deliveryAddress.pincode} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Estimated Delivery</label>
              <input name="estimatedDelivery" value={editForm.estimatedDelivery} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select name="status" value={editForm.status} onChange={handleEditChange} className="w-full border rounded px-3 py-2">
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Payment Status</label>
              <select name="paymentStatus" value={editForm.paymentStatus} onChange={handleEditChange} className="w-full border rounded px-3 py-2">
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditModal} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={editLoading}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrderManagement; 