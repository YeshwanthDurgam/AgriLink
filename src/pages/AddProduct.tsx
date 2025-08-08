import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Upload, 
  X, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Image as ImageIcon
} from 'lucide-react';
import { apiService, CreateProductData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const AddProduct = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<string>('');
  const [errorBoundary, setErrorBoundary] = useState<string | null>(null);
  const { user } = useAuth();

  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    category: 'Vegetables',
    subcategory: '',
    price: '',
    unit: 'kg',
    minOrderQuantity: '',
    maxOrderQuantity: '',
    quantity: '',
    organic: false,
    certifications: [],
    qualityGrade: 'Standard',
    harvestDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    shelfLife: '',
    farmName: '',
    farmLocation: '',
    availableLocations: [],
    deliveryRadius: '',
    deliveryTime: '',
    isFeatured: false,
    isSeasonal: false,
    tags: [],
    searchKeywords: [],
    basePrice: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Categories and their subcategories
  const categories = {
    'Vegetables': ['Tomatoes', 'Potatoes', 'Onions', 'Carrots', 'Spinach', 'Cabbage', 'Cauliflower', 'Other'],
    'Fruits': ['Apples', 'Bananas', 'Mangoes', 'Oranges', 'Grapes', 'Pomegranate', 'Other'],
    'Grains': ['Rice', 'Wheat', 'Corn', 'Quinoa', 'Millet', 'Other'],
    'Herbs': ['Basil', 'Mint', 'Coriander', 'Parsley', 'Rosemary', 'Other'],
    'Seeds': ['Sunflower', 'Pumpkin', 'Chia', 'Flax', 'Other'],
    'Dairy': ['Milk', 'Cheese', 'Yogurt', 'Butter', 'Other']
  };

  const units = ['kg', 'gram', 'piece', 'dozen', 'box', 'bunch', 'liter', 'pack'];
  const qualityGrades = ['Premium', 'Grade A', 'Grade B', 'Standard'];
  const certifications = ['Organic', 'GAP', 'HACCP', 'ISO', 'FSSAI', 'Other'];

  // Fetch farmers for admin selection; for farmer role, auto-select self
  useEffect(() => {
    const role = user?.role;
    if (role === 'farmer') {
      // Auto-select the logged-in farmer and skip network call
      const selfId = (user as any)?._id || user?.id;
      if (selfId) setSelectedFarmer(selfId);
      setFarmers([]);
      return;
    }

    if (role === 'admin') {
      (async () => {
        try {
          const res = await apiService.getFarmersAdmin();
          const farmerArr = Array.isArray((res as any)?.farmers) ? (res as any).farmers : [];
          setFarmers(farmerArr);
        } catch (e: any) {
          console.error('Failed to load farmers for admin:', e);
          toast.error('Failed to load farmers');
          setFarmers([]);
        }
      })();
    }
  }, [user]);

  // Handle form input changes
  const handleInputChange = (field: keyof CreateProductData, value: any) => {
    // Allow clearing number fields
    const numberFields = ['price', 'quantity', 'minOrderQuantity', 'maxOrderQuantity', 'shelfLife', 'deliveryRadius', 'deliveryTime'];
    if (numberFields.includes(field) && value === '') {
      setFormData(prev => ({ ...prev, [field]: '' }));
      return;
    }
    // Allow clearing date fields
    if ((field === 'harvestDate' || field === 'expiryDate') && value === '') {
      setFormData(prev => ({ ...prev, [field]: '' }));
      return;
    }
    // Handle date fields - convert date string to ISO string
    if (field === 'harvestDate' && value) {
      const date = new Date(value + 'T00:00:00.000Z');
      value = date.toISOString();
    } else if (field === 'expiryDate' && value) {
      const date = new Date(value + 'T00:00:00.000Z');
      value = date.toISOString();
    }
    // Always set basePrice when price is set
    if (field === 'price') {
      setFormData(prev => ({ ...prev, price: value, basePrice: value }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle array field changes (certifications, tags, etc.)
  const handleArrayFieldChange = (field: keyof CreateProductData, value: string, action: 'add' | 'remove') => {
    const currentArray = (formData[field] as string[]) || [];
    let newArray: string[];

    if (action === 'add') {
      newArray = [...currentArray, value];
    } else {
      newArray = currentArray.filter(item => item !== value);
    }

    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (uploadedImages.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file.`);
        return false;
      }
      return true;
    });

    setUploadedImages(prev => [...prev, ...validFiles]);

    // Create preview URLs
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviewUrls(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.price === '' || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    if (formData.quantity === '' || isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0) {
      newErrors.quantity = 'Quantity is required and cannot be negative';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.unit) {
      newErrors.unit = 'Unit is required';
    }
    // Only admins must explicitly select a farmer
    if (user?.role === 'admin' && !selectedFarmer) {
      newErrors.farmer = 'Farmer is required';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fill all required fields');
      return false;
    }
    return true;
  };

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (data: CreateProductData) => apiService.createProduct(data),
    onSuccess: (response) => {
      toast.success('Product created successfully!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Upload images if any
      if (uploadedImages.length > 0) {
        // Helper function to get product ID from response
        const getProductId = (product: any) => {
          return product._id || product.id;
        };
        const productId = getProductId(response.product);
        if (!productId) {
          toast.error('Product ID not found in response');
          setIsSubmitting(false);
          return;
        }
        uploadImagesMutation.mutate({
          productId: productId,
          files: uploadedImages
        });
      } else {
        navigate(user?.role === 'admin' ? '/admin/products' : '/manage-products');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create product');
      setIsSubmitting(false);
    }
  });

  // Upload images mutation
  const uploadImagesMutation = useMutation({
    mutationFn: ({ productId, files }: { productId: string; files: File[] }) => 
      apiService.uploadProductImages(productId, files),
    onSuccess: () => {
      // No need to show a separate success toast for images
      navigate(user?.role === 'admin' ? '/admin/products' : '/manage-products');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload images');
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    if (user?.role === 'admin' && !selectedFarmer) {
      toast.error('Please select a farmer for this product');
      return;
    }
    setIsSubmitting(true);
    const payload: any = {
      ...formData,
      price: formData.price === '' ? undefined : Number(formData.price),
      basePrice: formData.basePrice === '' ? undefined : Number(formData.basePrice),
      minOrderQuantity: formData.minOrderQuantity === '' ? undefined : Number(formData.minOrderQuantity),
      maxOrderQuantity: formData.maxOrderQuantity === '' ? undefined : Number(formData.maxOrderQuantity),
      quantity: formData.quantity === '' ? undefined : Number(formData.quantity),
      shelfLife: formData.shelfLife === '' ? undefined : Number(formData.shelfLife),
      deliveryRadius: formData.deliveryRadius === '' ? undefined : Number(formData.deliveryRadius),
      deliveryTime: formData.deliveryTime === '' ? undefined : Number(formData.deliveryTime),
      expiryDate: formData.expiryDate === '' ? undefined : formData.expiryDate,
    };
    if (user?.role === 'admin') {
      payload.farmer = selectedFarmer;
    }
    createProductMutation.mutate(payload);
  };

  try {
    if (errorBoundary) throw new Error(errorBoundary);
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
            <p className="text-gray-600">Create a new product listing for a farmer</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Farmer Selection (admins only). Farmers create for themselves automatically */}
            {user?.role === 'admin' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Farmer</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="farmer">Select Farmer *</Label>
                  <Select value={selectedFarmer} onValueChange={setSelectedFarmer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a farmer" />
                    </SelectTrigger>
                    <SelectContent>
                      {farmers.map(farmer => (
                        <SelectItem key={farmer._id} value={farmer._id}>
                          {farmer.name} ({farmer.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Farmer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-700">
                    Creating product as: <span className="font-medium">{user?.name}</span>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Basic Information */}
                <Card>
                  <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="e.g., Organic Tomatoes"
                      className={errors.name ? 'border-red-500' : ''}
                        />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                      </div>

                      <div>
                        <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                          <SelectTrigger>
                        <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                        {Object.keys(categories).map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                <div>
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Select value={formData.subcategory} onValueChange={(value) => handleInputChange('subcategory', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories[formData.category as keyof typeof categories]?.map((subcategory) => (
                        <SelectItem key={subcategory} value={subcategory}>
                          {subcategory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your product, its quality, growing methods, etc."
                        rows={4}
                    className={errors.description ? 'border-red-500' : ''}
                      />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                    </div>
              </CardContent>
            </Card>

            {/* Pricing & Inventory */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                    <Label htmlFor="price">Price (₹) *</Label>
                        <Input
                          id="price"
                          type="number"
                          value={formData.price ?? ''}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || '')}
                          placeholder="0.00"
                      className={errors.price ? 'border-red-500' : ''}
                        />
                    {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                      </div>

                      <div>
                        <Label htmlFor="unit">Unit *</Label>
                    <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                          <SelectTrigger>
                        <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="quantity">Available Quantity *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={formData.quantity ?? ''}
                      onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || '')}
                          placeholder="0"
                      className={errors.quantity ? 'border-red-500' : ''}
                    />
                    {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minOrderQuantity">Minimum Order Quantity</Label>
                    <Input
                      id="minOrderQuantity"
                      type="number"
                      value={formData.minOrderQuantity ?? ''}
                      onChange={(e) => handleInputChange('minOrderQuantity', parseFloat(e.target.value) || '')}
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxOrderQuantity">Maximum Order Quantity</Label>
                    <Input
                      id="maxOrderQuantity"
                      type="number"
                      value={formData.maxOrderQuantity ?? ''}
                      onChange={(e) => handleInputChange('maxOrderQuantity', parseFloat(e.target.value) || '')}
                      placeholder="No limit"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quality & Certifications */}
            <Card>
              <CardHeader>
                <CardTitle>Quality & Certifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="organic"
                    checked={formData.organic}
                    onCheckedChange={(checked) => handleInputChange('organic', checked)}
                  />
                  <Label htmlFor="organic">Organic Product</Label>
                </div>

                <div>
                  <Label>Quality Grade</Label>
                  <Select value={formData.qualityGrade} onValueChange={(value) => handleInputChange('qualityGrade', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {qualityGrades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Certifications</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {certifications.map((cert) => (
                      <div key={cert} className="flex items-center space-x-2">
                        <Checkbox
                          id={cert}
                          checked={formData.certifications?.includes(cert)}
                          onCheckedChange={(checked) => 
                            handleArrayFieldChange('certifications', cert, checked ? 'add' : 'remove')
                          }
                        />
                        <Label htmlFor={cert} className="text-sm">{cert}</Label>
                      </div>
                    ))}
                      </div>
                    </div>
              </CardContent>
            </Card>

            {/* Harvest & Expiry */}
            <Card>
              <CardHeader>
                <CardTitle>Harvest & Expiry Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="harvestDate">Harvest Date *</Label>
                      <Input
                        id="harvestDate"
                        type="date"
                        value={formData.harvestDate}
                      onChange={(e) => handleInputChange('harvestDate', e.target.value)}
                      className={errors.harvestDate ? 'border-red-500' : ''}
                    />
                    {errors.harvestDate && <p className="text-red-500 text-sm mt-1">{errors.harvestDate}</p>}
                  </div>

                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={formData.expiryDate}
                      onChange={e => setFormData((prev: any) => ({ ...prev, expiryDate: e.target.value }))}
                    />
                  </div>
                    </div>

                <div>
                  <Label htmlFor="shelfLife">Shelf Life (days)</Label>
                  <Input
                    id="shelfLife"
                    type="number"
                    value={formData.shelfLife ?? ''}
                    onChange={(e) => handleInputChange('shelfLife', parseInt(e.target.value) || '')}
                    placeholder="e.g., 7"
                  />
                    </div>
                  </CardContent>
                </Card>

            {/* Delivery Information */}
                <Card>
                  <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
                  </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deliveryRadius">Delivery Radius (km)</Label>
                    <Input
                      id="deliveryRadius"
                      type="number"
                      value={formData.deliveryRadius ?? ''}
                      onChange={(e) => handleInputChange('deliveryRadius', parseFloat(e.target.value) || '')}
                      placeholder="50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="deliveryTime">Delivery Time (hours)</Label>
                    <Input
                      id="deliveryTime"
                      type="number"
                      value={formData.deliveryTime ?? ''}
                      onChange={(e) => handleInputChange('deliveryTime', parseFloat(e.target.value) || '')}
                      placeholder="24"
                    />
                  </div>
                    </div>
                  </CardContent>
                </Card>

            {/* Product Images */}
            <Card>
                  <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <p className="text-sm text-gray-600">Upload up to 5 images (max 5MB each)</p>
                  </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Click to upload images</p>
                  </label>
                </div>

                {/* Image Previews */}
                {imagePreviewUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                  </CardContent>
                </Card>

            {/* Additional Options */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                  />
                  <Label htmlFor="isFeatured">Feature this product (admin approval required)</Label>
            </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isSeasonal"
                    checked={formData.isSeasonal}
                    onCheckedChange={(checked) => handleInputChange('isSeasonal', checked)}
                  />
                  <Label htmlFor="isSeasonal">Seasonal product</Label>
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Product...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Product
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/admin/products')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
    );
  } catch (err: any) {
    return <div style={{color: 'red', fontWeight: 'bold'}}>Error rendering AddProduct: {err.message}</div>;
  }
};

export default AddProduct;
