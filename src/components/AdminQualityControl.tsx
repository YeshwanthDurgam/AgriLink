import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Flag, Shield, AlertTriangle, CheckCircle, XCircle, Eye, Star } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { IndianRupee } from 'lucide-react';

interface FlaggedProduct {
  _id: string;
  productId: string;
  productName: string;
  farmerName: string;
  flagCount: number;
  reasons: string[];
  status: 'pending' | 'reviewed' | 'resolved';
  flaggedDate: string;
}

interface RefundRequest {
  _id: string;
  orderId: string;
  productName: string;
  buyerName: string;
  reason: string;
  description: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
  amount: number;
}

interface QualityCheck {
  _id: string;
  checkType: string;
  result: string;
  score?: number;
  notes?: string;
  images?: string[];
  checkedBy?: { name: string };
  checkedAt: string;
}

interface ProductQC {
  _id: string;
  name: string;
  farmerName: string;
  status: string;
  qualityChecks: QualityCheck[];
  approvalStatus?: { status: string };
}

const AdminQualityControl = () => {
  const [flaggedProducts, setFlaggedProducts] = useState<FlaggedProduct[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loadingFlags, setLoadingFlags] = useState(true);
  const [loadingRefunds, setLoadingRefunds] = useState(true);
  const [errorFlags, setErrorFlags] = useState('');
  const [errorRefunds, setErrorRefunds] = useState('');
  const [adminResponse, setAdminResponse] = useState('');
  const [qualityProducts, setQualityProducts] = useState<ProductQC[]>([]);
  const [loadingQC, setLoadingQC] = useState(true);
  const [errorQC, setErrorQC] = useState('');
  const [qcStatusFilter, setQCStatusFilter] = useState('all');
  const [qcSearch, setQCSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductQC | null>(null);
  const [qcModalOpen, setQCModalOpen] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [approvalScore, setApprovalScore] = useState<number | undefined>(undefined);
  const [approvalLoading, setApprovalLoading] = useState(false);

  // Fetch flagged products
  useEffect(() => {
    const fetchFlags = async () => {
      setLoadingFlags(true);
      setErrorFlags('');
      try {
        const res = await apiService.get('/admin/produce/flags?status=pending');
        if (res.success) {
          setFlaggedProducts(res.data || []);
        } else {
          setErrorFlags(res.message || 'Failed to fetch flagged products');
        }
      } catch (err: any) {
        setErrorFlags(err.message || 'Failed to fetch flagged products');
      } finally {
        setLoadingFlags(false);
      }
    };
    fetchFlags();
  }, []);

  // Fetch refund requests
  useEffect(() => {
    const fetchRefunds = async () => {
      setLoadingRefunds(true);
      setErrorRefunds('');
      try {
        const res = await apiService.get('/admin/orders/refunds?status=pending');
        if (res.success) {
          setRefundRequests(res.data || []);
        } else {
          setErrorRefunds(res.message || 'Failed to fetch refund requests');
        }
      } catch (err: any) {
        setErrorRefunds(err.message || 'Failed to fetch refund requests');
      } finally {
        setLoadingRefunds(false);
      }
    };
    fetchRefunds();
  }, []);

  // Fetch products with quality checks
  useEffect(() => {
    const fetchQCProducts = async () => {
      setLoadingQC(true);
      setErrorQC('');
      try {
        const res = await apiService.get('/admin/produce?limit=100');
        if (res.success) {
          setQualityProducts((res.data.docs || []).map((p: any) => ({
            _id: p._id,
            name: p.name,
            farmerName: p.farmer?.name || '-',
            status: p.status,
            qualityChecks: p.qualityChecks || [],
            approvalStatus: p.approvalStatus
          })));
        } else {
          setErrorQC(res.message || 'Failed to fetch products');
        }
      } catch (err: any) {
        setErrorQC(err.message || 'Failed to fetch products');
      } finally {
        setLoadingQC(false);
      }
    };
    fetchQCProducts();
  }, []);

  // Filtering
  const filteredQCProducts = qualityProducts.filter(p => {
    const latestQC = p.qualityChecks[p.qualityChecks.length - 1];
    const matchesStatus = qcStatusFilter === 'all' || (latestQC && latestQC.result === qcStatusFilter);
    const matchesSearch = p.name.toLowerCase().includes(qcSearch.toLowerCase()) || p.farmerName.toLowerCase().includes(qcSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleFlaggedProductAction = async (flagId: string, action: 'resolve' | 'warn_farmer' | 'hide_product') => {
    let endpoint = `/admin/produce/flags/${flagId}/`;
    if (action === 'resolve') endpoint += 'resolve';
    if (action === 'warn_farmer') endpoint += 'warn';
    if (action === 'hide_product') endpoint += 'hide';
    try {
      await apiService.post(endpoint, { response: adminResponse });
      setFlaggedProducts(prev => prev.filter(flag => flag._id !== flagId));
      toast.success(`Flagged product ${action.replace('_', ' ')}d`);
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  const handleRefundAction = async (requestId: string, action: 'approve' | 'reject') => {
    let endpoint = `/admin/orders/refunds/${requestId}/` + action;
    try {
      await apiService.post(endpoint, { response: adminResponse });
      setRefundRequests(prev => prev.filter(request => request._id !== requestId));
      toast.success(`Refund request ${action}d`);
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  // Approve/Reject product
  const handleApprove = async () => {
    if (!selectedProduct) return;
    setApprovalLoading(true);
    try {
      const res = await apiService.post(`/admin/produce/${selectedProduct._id}/approve`, {
        notes: approvalNote,
        qualityScore: approvalScore
      });
      if (res.success) {
        toast.success('Product approved');
        setSelectedProduct({ ...selectedProduct, status: 'active', approvalStatus: { status: 'approved' } });
        setQualityProducts(prev => prev.map(p => p._id === selectedProduct._id ? { ...p, status: 'active', approvalStatus: { status: 'approved' } } : p));
      } else {
        toast.error(res.message || 'Failed to approve');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve');
    } finally {
      setApprovalLoading(false);
    }
  };
  const handleReject = async () => {
    if (!selectedProduct) return;
    setApprovalLoading(true);
    try {
      const res = await apiService.post(`/admin/produce/${selectedProduct._id}/reject`, {
        reason: approvalNote,
        notes: approvalNote
      });
      if (res.success) {
        toast.success('Product rejected');
        setSelectedProduct({ ...selectedProduct, status: 'rejected', approvalStatus: { status: 'rejected' } });
        setQualityProducts(prev => prev.map(p => p._id === selectedProduct._id ? { ...p, status: 'rejected', approvalStatus: { status: 'rejected' } } : p));
      } else {
        toast.error(res.message || 'Failed to reject');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject');
    } finally {
      setApprovalLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quality Control Center</h2>
        <p className="text-gray-600">Manage product flags, refund requests, and quality assurance</p>
      </div>

      <Tabs defaultValue="flagged" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="flagged" className="flex items-center gap-2" title="Community-flagged products for review">
            <Flag className="w-4 h-4" />
            Flagged Products ({flaggedProducts.filter(f => f.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="refunds" className="flex items-center gap-2" title="Buyer refund requests">
            <Shield className="w-4 h-4" />
            Refund Requests ({refundRequests.filter(r => r.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="quality-checks" className="flex items-center gap-2" title="All product QC, approval, and history">
            <CheckCircle className="w-4 h-4" />
            Product Quality Checks
          </TabsTrigger>
          <TabsTrigger value="quality-badges" className="flex items-center gap-2" title="Badge management and leaderboard (coming soon)">
            <Star className="w-4 h-4" />
            Quality Badges
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flagged" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Community Flagged Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingFlags ? (
                <div className="text-center py-8 text-gray-500">Loading flagged products...</div>
              ) : errorFlags ? (
                <div className="text-center py-8 text-red-500">{errorFlags}</div>
              ) : (
                <div className="space-y-4">
                  {flaggedProducts.map((flag) => (
                    <div key={flag._id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{flag.productName}</h3>
                            <Badge className={getStatusColor(flag.status)}>
                              {flag.status}
                            </Badge>
                            <Badge variant="destructive">
                              {flag.flagCount} flags
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            by {flag.farmerName} • Flagged on {flag.flaggedDate}
                          </p>
                          <div className="mb-3">
                            <p className="text-sm font-medium mb-1">Reported Issues:</p>
                            <div className="flex flex-wrap gap-1">
                              {flag.reasons.map((reason, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View Product
                        </Button>
                      </div>
                      {flag.status === 'pending' && (
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFlaggedProductAction(flag._id, 'resolve')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark Resolved
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFlaggedProductAction(flag._id, 'warn_farmer')}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Warn Farmer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFlaggedProductAction(flag._id, 'hide_product')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Hide Product
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {flaggedProducts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p>All flagged products have been reviewed!</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Refund Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRefunds ? (
                <div className="text-center py-8 text-gray-500">Loading refund requests...</div>
              ) : errorRefunds ? (
                <div className="text-center py-8 text-red-500">{errorRefunds}</div>
              ) : (
                <div className="space-y-4">
                  {refundRequests.map((request) => (
                    <div key={request._id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{request.productName}</h3>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            by {request.buyerName} • Submitted on {request.submittedDate}
                          </p>
                          <div className="mb-3">
                            <p className="text-sm font-medium mb-1">Reason:</p>
                            <Badge variant="outline" className="text-xs">
                              {request.reason}
                            </Badge>
                          </div>
                          <div className="mb-3">
                            <p className="text-sm font-medium mb-1">Description:</p>
                            <span className="text-xs text-gray-700">{request.description}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {request.images && request.images.length > 0 && (
                            <img src={request.images[0]} alt="Refund" className="w-20 h-20 object-cover rounded" />
                          )}
                          <span className="text-xs text-gray-500 mt-2">Amount: ₹{request.amount}</span>
                        </div>
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRefundAction(request._id, 'approve')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRefundAction(request._id, 'reject')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {refundRequests.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p>All refund requests have been processed!</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality-checks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Product Quality Checks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              <div className="flex gap-6 mb-6">
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold">{qualityProducts.length}</span>
                  <span className="text-xs text-gray-500">Total Products</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold">{qualityProducts.filter(p => p.status === 'pending_approval').length}</span>
                  <span className="text-xs text-gray-500">Pending Approval</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold">{qualityProducts.filter(p => p.status === 'active').length}</span>
                  <span className="text-xs text-gray-500">Active</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold">{qualityProducts.filter(p => p.status === 'rejected').length}</span>
                  <span className="text-xs text-gray-500">Rejected</span>
                </div>
              </div>
              {/* Advanced Filtering UI */}
              <div className="flex gap-4 mb-4">
                <Input
                  placeholder="Search by product or farmer..."
                  value={qcSearch}
                  onChange={e => setQCSearch(e.target.value)}
                  className="max-w-xs"
                />
                <select
                  value={qcStatusFilter}
                  onChange={e => setQCStatusFilter(e.target.value)}
                  className="border rounded-md px-3 py-2"
                >
                  <option value="all">All Status</option>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                  <option value="pending">Pending</option>
                </select>
                {/* Score Range Filter (UI only for now) */}
                <Input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  placeholder="Min Score"
                  className="w-24"
                  disabled
                />
                <Input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  placeholder="Max Score"
                  className="w-24"
                  disabled
                />
              </div>
              {loadingQC ? (
                <div className="text-center py-8 text-gray-500">Loading quality checks...</div>
              ) : errorQC ? (
                <div className="text-center py-8 text-red-500">{errorQC}</div>
              ) : (
                <div className="space-y-4">
                  {filteredQCProducts.map((product) => {
                    const latestQC = product.qualityChecks[product.qualityChecks.length - 1];
                    return (
                      <div key={product._id} className="border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedProduct(product); setQCModalOpen(true); }}>
                        <div>
                          <div className="font-semibold text-lg">{product.name}</div>
                          <div className="text-gray-600 text-sm">Farmer: {product.farmerName}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {latestQC && (
                            <Badge className={latestQC.result === 'pass' ? 'bg-green-100 text-green-800' : latestQC.result === 'fail' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                              {latestQC.result}
                            </Badge>
                          )}
                          <Badge className={product.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' : product.status === 'active' ? 'bg-green-100 text-green-800' : product.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
                            {product.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                  {filteredQCProducts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p>No products found for this filter.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Product QC Modal */}
          <Dialog open={qcModalOpen} onOpenChange={v => { setQCModalOpen(v); if (!v) setSelectedProduct(null); }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Product Quality Checks</DialogTitle>
              </DialogHeader>
              {selectedProduct && (
                <div className="space-y-4">
                  <div className="font-semibold text-lg">{selectedProduct.name}</div>
                  <div className="text-gray-600 text-sm mb-2">Farmer: {selectedProduct.farmerName}</div>
                  <div className="space-y-2">
                    {selectedProduct.qualityChecks.length === 0 ? (
                      <div className="text-gray-500">No quality checks found for this product.</div>
                    ) : (
                      selectedProduct.qualityChecks.map((qc, idx) => (
                        <div key={qc._id || idx} className="border rounded p-2 bg-gray-50">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={qc.result === 'pass' ? 'bg-green-100 text-green-800' : qc.result === 'fail' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                              {qc.result}
                            </Badge>
                            <span className="font-medium">{qc.checkType}</span>
                            {qc.score !== undefined && <span className="ml-2 text-xs text-gray-600">Score: {qc.score}</span>}
                            <span className="ml-2 text-xs text-gray-500">{new Date(qc.checkedAt).toLocaleString()}</span>
                          </div>
                          {qc.notes && <div className="text-xs text-gray-700 mb-1">Notes: {qc.notes}</div>}
                          {qc.images && qc.images.length > 0 && (
                            <div className="flex gap-2 mt-1">
                              {qc.images.map((img, i) => (
                                <img key={i} src={img} alt="evidence" className="w-12 h-12 object-cover rounded border" />
                              ))}
                            </div>
                          )}
                          {qc.checkedBy && <div className="text-xs text-gray-500 mt-1">Checked by: {qc.checkedBy.name}</div>}
                        </div>
                      ))
                    )}
                  </div>
                  {/* Approve/Reject actions if pending approval */}
                  {selectedProduct.status === 'pending_approval' && (
                    <div className="mt-4 space-y-2">
                      <Textarea
                        placeholder="Add approval/rejection note..."
                        value={approvalNote}
                        onChange={e => setApprovalNote(e.target.value)}
                        disabled={approvalLoading}
                      />
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        className="border rounded px-3 py-2 w-32"
                        placeholder="Quality Score"
                        value={approvalScore === undefined ? '' : approvalScore}
                        onChange={e => setApprovalScore(e.target.value ? parseFloat(e.target.value) : undefined)}
                        disabled={approvalLoading}
                      />
                      <div className="flex gap-2 mt-2">
                        <Button onClick={handleApprove} disabled={approvalLoading}>
                          {approvalLoading ? 'Approving...' : 'Approve Product'}
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={approvalLoading}>
                          {approvalLoading ? 'Rejecting...' : 'Reject Product'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="quality-badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Quality Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                {/* Implement quality badges integration here if needed */}
                Coming soon: Quality badge management for top farmers and products.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminQualityControl;
