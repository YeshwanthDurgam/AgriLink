import { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { getPrimaryImageUrl } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const ManageProducts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // keep for UI, but override for admin fetch
  const [editProduct, setEditProduct] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    quantity: '',
    category: '',
    unit: '',
    description: '',
    status: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const queryClient = useQueryClient();

  // Approve product mutation
  const approveProductMutation = useMutation({
    mutationFn: (productId: string) => apiService.updateProductStatus(productId, 'active'),
    onSuccess: () => {
      toast.success('Product approved successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      console.error('Approve product error:', error);
      const message = error?.message || (error?.response?.message) || 'Failed to approve product';
      toast.error(message);
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => apiService.deleteProduct(productId),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      console.error('Delete product error:', error);
      const message = error?.message || (error?.response?.message) || 'Failed to delete product';
      toast.error(message);
    }
  });

  // Fetch products from backend
  // For admin, fetch all products regardless of status
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiService.getProducts({ status: 'all' })
  });
  const products = data?.products || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'out_of_stock':
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Out of Stock
          </Badge>
        );
      case 'pending_approval':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending Approval
          </Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openEditModal = (product: any) => {
    setEditProduct(product);
    setEditForm({
      name: product.name || '',
      price: product.basePrice || product.price || '',
      quantity: product.quantity || '',
      category: product.category || '',
      unit: product.unit || '',
      description: product.description || '',
      status: product.status || '',
    });
  };

  const closeEditModal = () => {
    setEditProduct(null);
    setEditForm({ name: '', price: '', quantity: '', category: '', unit: '', description: '', status: '' });
    setEditLoading(false);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    if (!editProduct) return;
    setEditLoading(true);
    try {
      const res = await apiService.put(`/admin/produce/${editProduct._id}`, editForm);
      if (res.success) {
        toast.success('Product updated successfully');
        if (data && data.products) {
          data.products = data.products.map((p: any) => p._id === editProduct._id ? { ...p, ...editForm } : p);
        }
        closeEditModal();
      } else {
        toast.error(res.message || 'Failed to update product');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update product');
    } finally {
      setEditLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading products...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">Failed to load products.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Products</h1>
          <p className="text-gray-600">Oversee your product listings and inventory</p>
        </div>
        <Link to="/admin/products/add">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{products.length}</div>
            <div className="text-sm text-gray-600">Total Products</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {products.filter((p: any) => p.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {products.filter((p: any) => p.status === 'out_of_stock').length}
            </div>
            <div className="text-sm text-gray-600">Out of Stock</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {products.filter((p: any) => p.status === 'pending_approval').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProducts.map((product: any) => (
              <div
                key={product._id || product.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => openEditModal(product)}
              >
                <img
                  src={getPrimaryImageUrl(product.images)}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    {getStatusBadge(product.status)}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {product.category} • ₹{product.basePrice || product.price}/{product.unit}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Stock: {product.quantity} {product.unit}s</span>
                    <span>Orders: {product.orders || 0}</span>
                    <span>Revenue: ₹{product.totalRevenue?.toLocaleString() || 0}</span>
                    <span>Listed: {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                </div>
                {/* Approve button for pending products */}
                {product.status === 'pending_approval' && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={e => {
                      e.stopPropagation();
                      approveProductMutation.mutate(product.id || product._id);
                    }}
                  >
                    Approve
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="ml-2"
                  onClick={e => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this product?')) {
                      deleteProductMutation.mutate(product._id || product.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(product)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem>Mark Out of Stock</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No products found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editProduct} onOpenChange={v => !v && closeEditModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Modify product details and save changes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input name="name" value={editForm.name} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Price</label>
              <input name="price" value={editForm.price} onChange={handleEditChange} className="w-full border rounded px-3 py-2" type="number" />
            </div>
            <div>
              <label className="block text-sm font-medium">Quantity</label>
              <input name="quantity" value={editForm.quantity} onChange={handleEditChange} className="w-full border rounded px-3 py-2" type="number" />
            </div>
            <div>
              <label className="block text-sm font-medium">Category</label>
              <input name="category" value={editForm.category} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Unit</label>
              <input name="unit" value={editForm.unit} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea name="description" value={editForm.description} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select name="status" value={editForm.status} onChange={handleEditChange} className="w-full border rounded px-3 py-2">
                <option value="active">Active</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="pending_approval">Pending Approval</option>
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

export default ManageProducts;
