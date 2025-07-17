import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, Clock, CheckCircle, AlertTriangle, Mail } from 'lucide-react';
import { IndianRupee } from 'lucide-react';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';

interface Dispute {
  _id?: string;
  status: string;
  reason?: string;
  description?: string;
  evidence?: string;
  resolution?: {
    action: string;
    amount?: number;
    notes: string;
    resolvedBy?: { _id: string; name: string };
    resolvedAt: string;
  };
}

interface Order {
  _id: string;
  orderNumber: string;
  buyer: { _id?: string; name: string; email?: string };
  orderStatus: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  dispute?: Dispute;
  disputes?: Dispute[];
  farmerOrders?: {
    _id: string;
    farmer: { _id?: string; name: string; email?: string };
  }[];
  [key: string]: any;
}

const STAT_LABELS = [
  { key: 'total', label: 'Total Orders', icon: <Package className="w-7 h-7 text-blue-600 mx-auto mb-1" /> },
  { key: 'pending', label: 'Pending Orders', icon: <Clock className="w-7 h-7 text-yellow-600 mx-auto mb-1" /> },
  { key: 'completed', label: 'Completed Orders', icon: <CheckCircle className="w-7 h-7 text-green-600 mx-auto mb-1" /> },
  { key: 'dispute', label: 'Dispute Orders', icon: <AlertTriangle className="w-7 h-7 text-orange-600 mx-auto mb-1" /> },
];

const PAGE_LIMIT = 10;

const AdminOrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [disputeActionLoading, setDisputeActionLoading] = useState(false);
  const [disputeNote, setDisputeNote] = useState('');
  const [messageModal, setMessageModal] = useState<{ open: boolean; userId: string; userName: string; email: string } | null>(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiService.get(`/admin/orders?page=1&limit=1000`);
        if (res.success) {
          setOrders(Array.isArray(res.data) ? res.data : res.data.docs || []);
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

  // Stats calculation
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.orderStatus === 'pending').length;
  const completedOrders = orders.filter(o => o.orderStatus === 'delivered' || o.orderStatus === 'completed').length;
  const disputeOrders = orders.filter(o => o.disputes && o.disputes.some((d: any) => d.status === 'open')).length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  const stats = [
    { ...STAT_LABELS[0], value: loading ? '...' : totalOrders },
    { ...STAT_LABELS[1], value: loading ? '...' : pendingOrders },
    { ...STAT_LABELS[2], value: loading ? '...' : completedOrders },
    { ...STAT_LABELS[3], value: loading ? '...' : disputeOrders },
    { key: 'revenue', label: 'Total Revenue', icon: <IndianRupee className="w-7 h-7 text-purple-600 mx-auto mb-1" />, value: loading ? '...' : `₹${totalRevenue.toLocaleString()}` },
  ];

  // Main list: first 10 orders
  const mainOrders = orders.slice(0, PAGE_LIMIT);
  // History: all orders (compact)
  const historyOrders = orders;

  // Dispute resolution handler
  const handleDisputeAction = async (orderId: string, disputeId: string, action: 'resolve' | 'reject') => {
    setDisputeActionLoading(true);
    try {
      const res = await apiService.post(`/admin/orders/${orderId}/dispute/${disputeId}/resolve`, {
        action,
        notes: disputeNote,
      });
      if (res.success) {
        toast.success('Dispute updated successfully');
        // Update the selectedOrder in state
        setSelectedOrder((prev) => {
          if (!prev) return prev;
          // Update the dispute status in the selected order
          let updated = { ...prev };
          if (updated.dispute && updated.dispute._id === disputeId) {
            updated.dispute.status = 'resolved';
          }
          if (updated.disputes) {
            updated.disputes = updated.disputes.map(d => d._id === disputeId ? { ...d, status: 'resolved' } : d);
          }
          return updated;
        });
        setDisputeNote('');
      } else {
        toast.error(res.message || 'Failed to update dispute');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update dispute');
    } finally {
      setDisputeActionLoading(false);
    }
  };

  // Send message handler
  const handleSendMessage = async () => {
    if (!messageModal) return;
    if (!messageSubject.trim() || !messageBody.trim()) {
      toast.error('Subject and message are required');
      return;
    }
    setMessageLoading(true);
    try {
      const res = await apiService.post('/admin/communication/contact-user', {
        userId: messageModal.userId,
        subject: messageSubject,
        message: messageBody,
      });
      if (res.success) {
        toast.success('Message sent successfully');
        setMessageModal(null);
        setMessageSubject('');
        setMessageBody('');
      } else {
        toast.error(res.message || 'Failed to send message');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setMessageLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Management</h2>
        <p className="text-gray-600">Monitor orders, manage delivery, and resolve disputes</p>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stats.map(stat => (
          <Card key={stat.key}>
            <CardContent className="p-4 text-center">
              {stat.icon}
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Orders List */}
      <div className="flex justify-between items-center mt-6 mb-2">
        <h3 className="text-lg font-semibold">Recent Orders</h3>
        {orders.length > PAGE_LIMIT && (
          <Button variant="outline" onClick={() => setShowHistory(true)}>
            View All Orders
          </Button>
        )}
      </div>
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading orders...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : mainOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No orders found</div>
        ) : (
          mainOrders.map(order => (
            <Card
              key={order._id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedOrder(order)}
            >
              <CardContent className="flex flex-col md:flex-row md:items-center justify-between p-5 min-h-[90px] gap-2">
                <div className="flex-1">
                  <div className="font-mono text-base font-semibold">{order.orderNumber || order._id}</div>
                  <div className="text-gray-700">Buyer: <span className="font-medium">{order.buyer?.name || '-'}</span></div>
                  <div className="text-gray-500 text-sm">{new Date(order.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex flex-col items-end gap-1 min-w-[120px]">
                  {/* Status badges */}
                  <div className="flex gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${order.orderStatus === 'delivered' || order.orderStatus === 'completed' ? 'bg-green-100 text-green-700' : order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' : order.orderStatus === 'disputed' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{order.orderStatus}</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${order.paymentStatus === 'completed' || order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' : order.paymentStatus === 'refunded' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{order.paymentStatus}</span>
                    {order.disputes && order.disputes.some(d => d.status === 'open') && (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-200 text-orange-800">Dispute</span>
                    )}
                  </div>
                  <span className="text-base font-bold text-purple-700">₹{order.total?.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {/* All Orders History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>All Orders History</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {historyOrders.map(order => (
                  <tr
                    key={order._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => { setSelectedOrder(order); setShowHistory(false); }}
                  >
                    <td className="px-3 py-2 font-mono text-sm">{order.orderNumber || order._id}</td>
                    <td className="px-3 py-2 text-sm">{order.buyer?.name || '-'}</td>
                    <td className="px-3 py-2 text-xs capitalize">{order.orderStatus}</td>
                    <td className="px-3 py-2 text-sm">₹{order.total?.toLocaleString()}</td>
                    <td className="px-3 py-2 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
      {/* Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={v => !v && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="font-mono text-lg font-bold">{selectedOrder.orderNumber || selectedOrder._id}</div>
              <div>Buyer: <span className="font-medium">{selectedOrder.buyer?.name || '-'}</span></div>
              <div>Status: <span className="font-semibold capitalize">{selectedOrder.orderStatus}</span></div>
              <div>Payment: <span className="font-semibold capitalize">{selectedOrder.paymentStatus}</span></div>
              <div>Total: <span className="font-semibold text-purple-700">₹{selectedOrder.total?.toLocaleString()}</span></div>
              <div>Date: <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span></div>
              {/* Dispute Section - show all disputes */}
              {selectedOrder.disputes && selectedOrder.disputes.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <span className="font-semibold text-orange-700">Disputes ({selectedOrder.disputes.length})</span>
                  </div>
                  <div className="space-y-3">
                    {selectedOrder.disputes.map((dispute, idx) => (
                      <div key={dispute._id || idx} className="border rounded p-3 bg-orange-50">
                        <div className="flex justify-between items-center">
                          <div className="font-semibold text-orange-800">Dispute #{idx + 1}</div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${dispute.status === 'open' ? 'bg-orange-200 text-orange-800' : 'bg-green-100 text-green-700'}`}>{dispute.status}</span>
                        </div>
                        <div className="mt-2 text-sm">
                          {dispute.reason && <div><span className="font-medium">Reason:</span> {dispute.reason}</div>}
                          {dispute.description && <div><span className="font-medium">Description:</span> {dispute.description}</div>}
                          {dispute.evidence && <div><span className="font-medium">Evidence:</span> <span className="italic text-gray-500">[Evidence file/image here]</span></div>}
                          {dispute.resolution && (
                            <div className="mt-1 text-xs text-gray-700">
                              <div><span className="font-semibold">Resolution:</span> {dispute.resolution.action} {dispute.resolution.amount ? `₹${dispute.resolution.amount}` : ''}</div>
                              <div><span className="font-semibold">Notes:</span> {dispute.resolution.notes}</div>
                              <div><span className="font-semibold">By:</span> {dispute.resolution.resolvedBy?.name || 'Admin'} on {dispute.resolution.resolvedAt ? new Date(dispute.resolution.resolvedAt).toLocaleString() : ''}</div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3">
                          {selectedOrder.farmerOrders?.[0]?.farmer?._id && (
                            <Button size="sm" variant="outline" onClick={() => setMessageModal({ open: true, userId: selectedOrder.farmerOrders[0].farmer._id, userName: selectedOrder.farmerOrders[0].farmer.name || 'Farmer', email: '' })}>
                              <Mail className="w-4 h-4 mr-1" /> Message Farmer
                            </Button>
                          )}
                          {selectedOrder.buyer?._id && (
                            <Button size="sm" variant="outline" onClick={() => setMessageModal({ open: true, userId: selectedOrder.buyer._id, userName: selectedOrder.buyer.name || 'Buyer', email: selectedOrder.buyer.email || '' })}>
                              <Mail className="w-4 h-4 mr-1" /> Message Buyer
                            </Button>
                          )}
                        </div>
                        <div className="mt-3">
                          <textarea
                            className="w-full border rounded px-3 py-2"
                            rows={2}
                            placeholder="Add resolution note..."
                            value={disputeNote}
                            onChange={e => setDisputeNote(e.target.value)}
                            disabled={disputeActionLoading}
                          />
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="default"
                              disabled={disputeActionLoading}
                              onClick={() => handleDisputeAction(selectedOrder._id, dispute._id || '', 'resolve')}
                            >
                              {disputeActionLoading ? 'Resolving...' : 'Resolve Dispute'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={disputeActionLoading}
                              onClick={() => handleDisputeAction(selectedOrder._id, dispute._id || '', 'reject')}
                            >
                              {disputeActionLoading ? 'Rejecting...' : 'Reject Dispute'}
                            </Button>
                          </div>
                        </div>
                        {/* Admin notes/history placeholder */}
                        <div className="mt-2 text-xs text-gray-500">Admin notes and resolution history will appear here.</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Message Modal */}
              <Dialog open={!!messageModal} onOpenChange={v => !v && setMessageModal(null)}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Send Message to {messageModal?.userName}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <input
                      className="w-full border rounded px-3 py-2"
                      placeholder="Subject"
                      value={messageSubject}
                      onChange={e => setMessageSubject(e.target.value)}
                      disabled={messageLoading}
                    />
                    <textarea
                      className="w-full border rounded px-3 py-2"
                      rows={4}
                      placeholder="Type your message..."
                      value={messageBody}
                      onChange={e => setMessageBody(e.target.value)}
                      disabled={messageLoading}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setMessageModal(null)} disabled={messageLoading}>Cancel</Button>
                      <Button onClick={handleSendMessage} disabled={messageLoading}>
                        {messageLoading ? 'Sending...' : 'Send'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrderManagement; 