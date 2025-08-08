import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, Product } from '@/lib/api';
import { Upload, X, Star, Trash2, Image as ImageIcon, Plus } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface EditProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (updated: Product) => void;
}

interface EditFormData {
  name: string;
  description: string;
  category: Product['category'];
  subcategory: string;
  basePrice: string;
  unit: Product['unit'];
  minOrderQuantity: string;
  maxOrderQuantity: string;
  quantity: string;
  organic: boolean;
  qualityGrade: Product['qualityGrade'];
  harvestDate: string;
  expiryDate: string;
  shelfLife: string;
  farmName: string;
  farmLocation: string;
  deliveryRadius: string;
  deliveryTime: string;
  status: Product['status'];
  tags: string;
  searchKeywords: string;
}

const EditProductDialog: React.FC<EditProductDialogProps> = ({
  product,
  open,
  onOpenChange,
  onSaved,
}) => {
  const [formData, setFormData] = useState<EditFormData>({
    name: '',
    description: '',
    category: 'Vegetables',
    subcategory: '',
    basePrice: '',
    unit: 'kg',
    minOrderQuantity: '1',
    maxOrderQuantity: '',
    quantity: '',
    organic: false,
    qualityGrade: 'Standard',
    harvestDate: '',
    expiryDate: '',
    shelfLife: '',
    farmName: '',
    farmLocation: '',
    deliveryRadius: '50',
    deliveryTime: '24',
    status: 'active',
    tags: '',
    searchKeywords: ''
  });

  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [editingImageUrls, setEditingImageUrls] = useState(false);
  const [imageUrls, setImageUrls] = useState<Array<{ url: string; alt: string; isPrimary: boolean }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update form data when product changes
  React.useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || 'Vegetables',
        subcategory: product.subcategory || '',
        basePrice: (product.basePrice || product.price || 0).toString(),
        unit: product.unit || 'kg',
        minOrderQuantity: (product.minOrderQuantity || 1).toString(),
        maxOrderQuantity: (product.maxOrderQuantity || '').toString(),
        quantity: (product.quantity || 0).toString(),
        organic: product.organic || false,
        qualityGrade: product.qualityGrade || 'Standard',
        harvestDate: product.harvestDate ? new Date(product.harvestDate).toISOString().split('T')[0] : '',
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
        shelfLife: (product.shelfLife || '').toString(),
        farmName: product.farmName || '',
        farmLocation: product.farmLocation || '',
        deliveryRadius: (product.deliveryRadius || 50).toString(),
        deliveryTime: (product.deliveryTime || 24).toString(),
        status: product.status || 'active',
        tags: (product.tags || []).join(', '),
        searchKeywords: (product.searchKeywords || []).join(', ')
      });

      // Initialize image URLs
      setImageUrls(product.images?.map(img => ({
        url: img.url,
        alt: img.alt || '',
        isPrimary: img.isPrimary || false
      })) || []);
    }
  }, [product]);

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: (data: any) => apiService.updateProduct(product!._id || product!.id, data),
    onSuccess: (result) => {
      const productId = product!._id || product!.id;
      const updatedFromServer = result?.product as any;
      const optimisticUpdated = {
        ...(product as any),
        ...updatedFromServer,
        // Fallback to formData merge if server didn't return full object
        name: updatedFromServer?.name ?? formData.name,
        description: updatedFromServer?.description ?? formData.description,
        category: updatedFromServer?.category ?? formData.category,
        subcategory: updatedFromServer?.subcategory ?? formData.subcategory,
        basePrice: updatedFromServer?.basePrice ?? parseFloat(formData.basePrice),
        unit: updatedFromServer?.unit ?? formData.unit,
        minOrderQuantity: updatedFromServer?.minOrderQuantity ?? parseInt(formData.minOrderQuantity),
        maxOrderQuantity: updatedFromServer?.maxOrderQuantity ?? (formData.maxOrderQuantity ? parseInt(formData.maxOrderQuantity) : undefined),
        quantity: updatedFromServer?.quantity ?? parseInt(formData.quantity),
        organic: updatedFromServer?.organic ?? formData.organic,
        qualityGrade: updatedFromServer?.qualityGrade ?? formData.qualityGrade,
        harvestDate: updatedFromServer?.harvestDate ?? formData.harvestDate,
        expiryDate: updatedFromServer?.expiryDate ?? (formData.expiryDate || undefined),
        shelfLife: updatedFromServer?.shelfLife ?? (formData.shelfLife ? parseInt(formData.shelfLife) : undefined),
        farmName: updatedFromServer?.farmName ?? formData.farmName,
        farmLocation: updatedFromServer?.farmLocation ?? formData.farmLocation,
        deliveryRadius: updatedFromServer?.deliveryRadius ?? parseInt(formData.deliveryRadius),
        deliveryTime: updatedFromServer?.deliveryTime ?? parseInt(formData.deliveryTime),
        status: updatedFromServer?.status ?? formData.status,
        tags: updatedFromServer?.tags ?? formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        searchKeywords: updatedFromServer?.searchKeywords ?? formData.searchKeywords.split(',').map(k => k.trim()).filter(Boolean),
      };

      // 1) Optimistically update all 'products' queries
      const productsCaches = queryClient.getQueriesData({ queryKey: ['products'] });
      productsCaches.forEach(([key, oldData]: any) => {
        if (!oldData?.products) return;
        const newProducts = oldData.products.map((p: any) => {
          const id = p.id || p._id;
          return id === productId ? { ...p, ...optimisticUpdated } : p;
        });
        queryClient.setQueryData(key, { ...oldData, products: newProducts });
      });

      // 2) Optimistically update the specific 'product' query
      queryClient.setQueryData(['product', productId], (old: any) => old ? { ...old, ...optimisticUpdated } : optimisticUpdated);

      // 3) Invalidate as a safety net to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products-home'] });

      // Notify parent to update local state immediately
      if (onSaved && updatedFromServer) {
        onSaved(updatedFromServer as Product);
      }

      toast({ title: 'Success', description: 'Product updated successfully' });
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message = error?.message || (error?.response?.data?.message) || 'Failed to update product';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  });

  // Upload images mutation
  const uploadImagesMutation = useMutation({
    mutationFn: (files: File[]) => apiService.uploadProductImages(
      product!._id || product!.id,
      files,
      (p) => setUploadProgress(p)
    ),
    onSuccess: (res: any) => {
      toast({ title: 'Success', description: 'Images uploaded successfully' });
      // Update local dialog state so new images are visible immediately
      if (Array.isArray(res?.images)) {
        setImageUrls(res.images.map((img: any) => ({
          url: img.url,
          alt: img.alt || '',
          isPrimary: !!img.isPrimary,
        })));
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setUploadingImages(false);
      setUploadProgress(null);
    },
    onError: (error: any) => {
      const message = error?.message || (error?.response?.data?.message) || 'Failed to upload images';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      setUploadingImages(false);
      setUploadProgress(null);
    }
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => apiService.deleteProductImage(product!._id || product!.id, imageId),
    onSuccess: (res: any) => {
      toast({ title: 'Success', description: 'Image deleted successfully' });
      if (Array.isArray(res?.images)) {
        setImageUrls(res.images.map((img: any) => ({
          url: img.url,
          alt: img.alt || '',
          isPrimary: !!img.isPrimary,
        })));
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeletingImage(null);
    },
    onError: (error: any) => {
      const message = error?.message || (error?.response?.data?.message) || 'Failed to delete image';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      setDeletingImage(null);
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const updateData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      subcategory: formData.subcategory,
      basePrice: parseFloat(formData.basePrice),
      unit: formData.unit,
      minOrderQuantity: parseInt(formData.minOrderQuantity),
      maxOrderQuantity: formData.maxOrderQuantity ? parseInt(formData.maxOrderQuantity) : undefined,
      quantity: parseInt(formData.quantity),
      organic: formData.organic,
      qualityGrade: formData.qualityGrade,
      harvestDate: formData.harvestDate,
      expiryDate: formData.expiryDate || undefined,
      shelfLife: formData.shelfLife ? parseInt(formData.shelfLife) : undefined,
      farmName: formData.farmName,
      farmLocation: formData.farmLocation,
      deliveryRadius: parseInt(formData.deliveryRadius),
      deliveryTime: parseInt(formData.deliveryTime),
      status: formData.status,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      searchKeywords: formData.searchKeywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword)
    };

    updateProductMutation.mutate(updateData);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImages(true);
    uploadImagesMutation.mutate(files);
  };

  const handleDeleteImage = (imageId: string) => {
    setDeletingImage(imageId);
    deleteImageMutation.mutate(imageId);
  };

  // Update image URLs mutation
  const updateImageUrlsMutation = useMutation({
    mutationFn: (images: Array<{ url: string; alt?: string; isPrimary?: boolean }>) => 
      apiService.updateProductImageUrls(product!._id || product!.id, images),
    onSuccess: (res: any) => {
      toast({ title: 'Success', description: 'Image URLs updated successfully' });
      if (Array.isArray(res?.images)) {
        setImageUrls(res.images.map((img: any) => ({
          url: img.url,
          alt: img.alt || '',
          isPrimary: !!img.isPrimary,
        })));
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditingImageUrls(false);
    },
    onError: (error: any) => {
      const message = error?.message || (error?.response?.data?.message) || 'Failed to update image URLs';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  });

  const handleImageUrlChange = (index: number, field: 'url' | 'alt' | 'isPrimary', value: string | boolean) => {
    setImageUrls(prev => prev.map((img, i) => 
      i === index ? { ...img, [field]: value } : img
    ));
  };

  // DnD image item
  const moveImage = (from: number, to: number) => {
    setImageUrls(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };
  const ImageTile: React.FC<{ image: any; index: number; onDelete: (idx: number) => void; }> = ({ image, index, onDelete }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [, drop] = useDrop({
      accept: 'img',
      hover(item: any) {
        if (!ref.current) return;
        const dragIndex = item.index;
        const hoverIndex = index;
        if (dragIndex === hoverIndex) return;
        moveImage(dragIndex, hoverIndex);
        item.index = hoverIndex;
      }
    });
    const [, drag] = useDrag({ type: 'img', item: { index } });
    drag(drop(ref));
    return (
      <div ref={ref} className="relative group">
        <img
          src={getImageUrl(image.url)}
          alt={image.alt || `Product image ${index + 1}`}
          className="w-full h-32 object-cover rounded-lg border"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onDelete(index)}
            disabled={deletingImage === String(index)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={image.isPrimary ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleImageUrlChange(index, 'isPrimary', true)}
          >
            <Star className="w-4 h-4" />
          </Button>
        </div>
        {image.isPrimary && (
          <Badge className="absolute top-2 left-2 bg-yellow-500">
            <Star className="w-3 h-3 mr-1" />
            Primary
          </Badge>
        )}
      </div>
    );
  };

  const handleAddImageUrl = () => {
    setImageUrls(prev => [...prev, { url: '', alt: '', isPrimary: false }]);
  };

  const handleRemoveImageUrl = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveImageUrls = () => {
    const validImages = imageUrls.filter(img => img.url.trim() !== '');
    if (validImages.length === 0) {
      toast({ title: 'Error', description: 'At least one image URL is required', variant: 'destructive' });
      return;
    }
    updateImageUrlsMutation.mutate(validImages);
  };

  const getPrimaryImageUrl = (images: Product['images']) => {
    if (!images || images.length === 0) {
      return '/placeholder.svg';
    }
    const primary = images.find(img => img.isPrimary);
    return primary ? primary.url : images[0].url;
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product: {product.name}</DialogTitle>
          <DialogDescription>
            Update product details and manage images. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Product Images</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingImageUrls(!editingImageUrls)}
                >
                  {editingImageUrls ? 'Cancel Edit' : 'Edit URLs'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingImages ? (uploadProgress !== null ? `Uploading ${uploadProgress}%` : 'Uploading...') : 'Upload Images'}
                </Button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {editingImageUrls ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  {imageUrls.map((image, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Image URL"
                          value={image.url}
                          onChange={(e) => handleImageUrlChange(index, 'url', e.target.value)}
                        />
                        <Input
                          placeholder="Alt text (optional)"
                          value={image.alt}
                          onChange={(e) => handleImageUrlChange(index, 'alt', e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={image.isPrimary}
                            onChange={(e) => handleImageUrlChange(index, 'isPrimary', e.target.checked)}
                            className="rounded"
                          />
                          <Label className="text-sm">Primary Image</Label>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveImageUrl(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddImageUrl}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Image URL
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveImageUrls}
                    disabled={updateImageUrlsMutation.isPending}
                  >
                    {updateImageUrlsMutation.isPending ? 'Saving...' : 'Save URLs'}
                  </Button>
                </div>
              </div>
            ) : (
              <DndProvider backend={HTML5Backend}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {imageUrls && imageUrls.length > 0 ? (
                    imageUrls.map((image, index) => (
                      <ImageTile
                        key={`${image.url}-${index}`}
                        image={image}
                        index={index}
                        onDelete={(idx) => handleDeleteImage(String(idx))}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No images uploaded</p>
                    </div>
                  )}
                </div>
              </DndProvider>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vegetables">Vegetables</SelectItem>
                  <SelectItem value="Fruits">Fruits</SelectItem>
                  <SelectItem value="Grains">Grains</SelectItem>
                  <SelectItem value="Herbs & Spices">Herbs & Spices</SelectItem>
                  <SelectItem value="Seeds">Seeds</SelectItem>
                  <SelectItem value="Dairy">Dairy</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Input
                id="subcategory"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleInputChange}
                placeholder="e.g., Leafy Greens, Root Vegetables"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Price (₹) *</Label>
              <Input
                id="basePrice"
                name="basePrice"
                type="number"
                step="0.01"
                value={formData.basePrice}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select value={formData.unit} onValueChange={(value) => handleSelectChange('unit', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="gram">gram</SelectItem>
                  <SelectItem value="piece">piece</SelectItem>
                  <SelectItem value="dozen">dozen</SelectItem>
                  <SelectItem value="box">box</SelectItem>
                  <SelectItem value="bunch">bunch</SelectItem>
                  <SelectItem value="liter">liter</SelectItem>
                  <SelectItem value="pack">pack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Available Quantity *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minOrderQuantity">Minimum Order Quantity</Label>
              <Input
                id="minOrderQuantity"
                name="minOrderQuantity"
                type="number"
                value={formData.minOrderQuantity}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxOrderQuantity">Maximum Order Quantity</Label>
              <Input
                id="maxOrderQuantity"
                name="maxOrderQuantity"
                type="number"
                value={formData.maxOrderQuantity}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualityGrade">Quality Grade</Label>
              <Select value={formData.qualityGrade} onValueChange={(value) => handleSelectChange('qualityGrade', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Grade A">Grade A</SelectItem>
                  <SelectItem value="Grade B">Grade B</SelectItem>
                  <SelectItem value="Standard">Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              required
            />
          </div>

          {/* Farm Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="farmName">Farm Name</Label>
              <Input
                id="farmName"
                name="farmName"
                value={formData.farmName}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="farmLocation">Farm Location</Label>
              <Input
                id="farmLocation"
                name="farmLocation"
                value={formData.farmLocation}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="harvestDate">Harvest Date *</Label>
              <Input
                id="harvestDate"
                name="harvestDate"
                type="date"
                value={formData.harvestDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                name="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shelfLife">Shelf Life (days)</Label>
              <Input
                id="shelfLife"
                name="shelfLife"
                type="number"
                value={formData.shelfLife}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Delivery Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryRadius">Delivery Radius (km)</Label>
              <Input
                id="deliveryRadius"
                name="deliveryRadius"
                type="number"
                value={formData.deliveryRadius}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryTime">Delivery Time (hours)</Label>
              <Input
                id="deliveryTime"
                name="deliveryTime"
                type="number"
                value={formData.deliveryTime}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Tags and Keywords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="organic, fresh, local"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="searchKeywords">Search Keywords (comma-separated)</Label>
              <Input
                id="searchKeywords"
                name="searchKeywords"
                value={formData.searchKeywords}
                onChange={handleInputChange}
                placeholder="tomato, red, ripe"
              />
            </div>
          </div>

          {/* Status and Organic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="organic"
                  checked={formData.organic}
                  onChange={handleInputChange}
                  className="rounded"
                />
                <span>Organic Product</span>
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateProductMutation.isPending}
            >
              {updateProductMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog; 