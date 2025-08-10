import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService, Product, ProductResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, AlertCircle, Clock, Check, Pencil, MoreVertical, Trash2, Eye, Plus, Package } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EditProductDialog from '@/components/EditProductDialog';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { getImageUrl } from '@/lib/utils';

const ManageProducts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth(); // Get logged-in user from AuthContext

  // Approve product mutation
  const approveProductMutation = useMutation({
    mutationFn: (productId: string) => apiService.updateProductStatus(productId, 'active'),
    onSuccess: () => {
      toast({title: 'Success', description: 'Product approved successfully'});
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      console.error('Approve product error:', error);
      const message = error?.message || (error?.response?.message) || 'Failed to approve product';
      toast({title: 'Error', description: message, variant: 'destructive'});
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => apiService.deleteProduct(productId),
    onSuccess: () => {
      toast({title: 'Success', description: 'Product deleted successfully'});
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      console.error('Delete product error:', error);
      const message = error?.message || (error?.response?.message) || 'Failed to delete product';
      toast({title: 'Error', description: message, variant: 'destructive'});
    }
  });

  // Fetch products from backend (scoped to current farmer)
  const { data, isLoading, error } = useQuery<ProductResponse, Error, ProductResponse>({
    queryKey: ['products', user?.id, page, statusFilter, searchTerm],
    queryFn: async () => {
      const params: any = { page, limit: 12 };
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm && searchTerm.trim() !== '') params.search = searchTerm.trim();
      if (user && user.role === 'farmer') {
        params.farmer = user.id;
      }
      const res = await apiService.getProducts(params);
      return res;
    },
    enabled: !!user, // wait until user is available
    placeholderData: (prev) => prev as ProductResponse | undefined,
    staleTime: 60 * 1000,
  });

  // Handle data after fetching
  useEffect(() => {
    if (data) {
      setProducts((prevProducts) => {
        // Replace existing items with fresh ones; keep others; add new ones (supports pagination)
        const prevById = new Map(prevProducts.map(p => [p.id || p._id, p]));
        const incomingIds = new Set<string>();
        data.products.forEach((incoming: any) => {
          const id = incoming.id || incoming._id;
          incomingIds.add(id);
          prevById.set(id, incoming);
        });
        return Array.from(prevById.values());
      });
      setTotalProducts(data.pagination.total);
      setHasMore(data.pagination.currentPage < data.pagination.totalPages);
    }
  }, [data]);

  if (isAuthLoading || (!user)) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading your products...</p>
      </div>
    );
  }

  if (user.role !== 'farmer' && user.role !== 'admin') {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Only farmer or admin accounts can manage products.</p>
      </div>
    );
  }

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

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openEditModal = (product: Product) => {
    setEditProduct(product);
  };

  const closeEditModal = () => {
    setEditProduct(null);
  };

  // Helper to get primary image URL
  const getPrimaryImageUrl = (images: Product['images']) => {
    if (!images || images.length === 0) {
      return '/placeholder.svg';
    }
    const primary = images.find(img => img.isPrimary);
    const url = primary ? primary.url : images[0].url;
    return getImageUrl(url);
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-red-500">
        <p>Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Manage Products"
        description="Create, update, and monitor your product listings"
        actions={(
          <Button onClick={() => window.location.href = '/add-product'}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        )}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Total products in the system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter(p => p.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Currently active products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter(p => p.status === 'out_of_stock').length}</div>
            <p className="text-xs text-muted-foreground">Products currently out of stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter(p => p.status === 'pending_approval').length}</div>
            <p className="text-xs text-muted-foreground">Products awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products ({products.length} of {totalProducts})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredProducts.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                No products found matching your criteria.
              </div>
            )}

            {filteredProducts.map((product: Product) => (
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
                {product.status === 'pending_approval' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      approveProductMutation.mutate(product.id);
                    }}
                    disabled={approveProductMutation.isPending}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProductMutation.mutate(product.id);
                    }}
                    disabled={deleteProductMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditModal(product)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteProductMutation.mutate(product.id)}>Delete</DropdownMenuItem>
                      {product.status === 'pending_approval' && (
                        <DropdownMenuItem onClick={() => approveProductMutation.mutate(product.id)}>Approve</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            {hasMore && (
              <div className="flex justify-center mt-4">
                <Button onClick={() => setPage((prevPage) => prevPage + 1)} disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EditProductDialog
        product={editProduct}
        open={!!editProduct}
        onOpenChange={closeEditModal}
        onSaved={(updated) => {
          setProducts((prev) => prev.map(p => (p.id === (updated as any).id || p._id === (updated as any)._id ? { ...p, ...updated } : p)));
        }}
      />
    </div>
  );
};

export default ManageProducts;

// Helper function (already present, adding for completeness if not there)
const getPrimaryImageUrl = (images: Product['images']) => {
  if (!images || images.length === 0) {
    return '/placeholder.svg';
  }
  const primary = images.find(img => img.isPrimary);
  const url = primary ? primary.url : images[0].url;
  return getImageUrl(url);
};
