const API_BASE_URL = 'http://localhost:5000/api';

// Types for API responses
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'buyer' | 'farmer' | 'admin';
  avatar?: string;
  bio?: string;
  location?: string;
  joinDate: string;
  isVerified: boolean;
  statusText: string;
  profileCompletion: number;
  farmName?: string;
  farmSize?: string;
  farmLocation?: string;
  certifications?: string[];
  preferences?: string[];
  favoriteCategories?: string[];
  notifications?: {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
  };
  privacy?: {
    showProfile: boolean;
    showLocation: boolean;
    showContact: boolean;
  };
  language?: string;
  currency?: string;
  stats?: {
    ordersPlaced: number;
    totalSpent: number;
    favoriteFarmers: number;
    reviewsGiven: number;
    productsListed: number;
    totalOrders: number;
    averageRating: number;
    monthlyRevenue: number;
  };
  // Security-related fields
  lastLogin?: string;
  loginAttempts?: number;
  lastPasswordChange?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // 2FA fields
  twoFactorEnabled?: boolean;
  backupCodesCount?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ProfileUpdateData {
  name?: string;
  phone?: string;
  bio?: string;
  location?: string;
  avatar?: string;
  farmName?: string;
  farmSize?: string;
  farmLocation?: string;
  certifications?: string[];
  preferences?: string[];
  favoriteCategories?: string[];
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    marketing?: boolean;
  };
  privacy?: {
    showProfile?: boolean;
    showLocation?: boolean;
    showContact?: boolean;
  };
  language?: string;
  currency?: string;
}

// Payment Method Types
export interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'wallet';
  name: string;
  maskedNumber?: string;
  expiryDate?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddPaymentMethodData {
  type: 'card' | 'upi' | 'wallet';
  name: string;
  number?: string;
  expiryDate?: string;
  cvv?: string;
  upiId?: string;
  walletType?: 'paytm' | 'gpay' | 'phonepe';
  phone?: string;
}

// Transaction Types
export interface Transaction {
  id: string;
  orderId?: string;
  type: 'order' | 'subscription' | 'refund' | 'commission';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  description: string;
  farmName?: string;
  buyerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

// Product Types
export interface Product {
  id?: string; // Frontend expects this
  _id?: string; // MongoDB returns this
  name: string;
  description: string;
  category: 'Vegetables' | 'Fruits' | 'Grains' | 'Herbs' | 'Seeds' | 'Dairy' | 'Other';
  subcategory?: string;
  price: number;
  unit: 'kg' | 'gram' | 'piece' | 'dozen' | 'box' | 'bunch' | 'liter' | 'pack';
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  quantity: number;
  reservedQuantity: number;
  organic: boolean;
  certifications: string[];
  qualityGrade: 'Premium' | 'Grade A' | 'Grade B' | 'Standard';
  harvestDate: string;
  expiryDate?: string;
  shelfLife?: number;
  images: Array<{
    id: string;
    url: string;
    alt?: string;
    isPrimary: boolean;
  }>;
  farmer: User;
  farmName?: string;
  farmLocation?: string;
  availableLocations: string[];
  deliveryRadius: number;
  deliveryTime: number;
  status: 'active' | 'inactive' | 'out_of_stock' | 'pending_approval' | 'rejected';
  isFeatured: boolean;
  isSeasonal: boolean;
  tags: string[];
  searchKeywords: string[];
  views: number;
  orders: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductResponse {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

export interface CreateProductData {
  name: string;
  description: string;
  category: Product['category'];
  subcategory?: string;
  price: number;
  unit: Product['unit'];
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  quantity: number;
  organic?: boolean;
  certifications?: string[];
  qualityGrade?: Product['qualityGrade'];
  harvestDate: string;
  expiryDate?: string;
  shelfLife?: number;
  farmName?: string;
  farmLocation?: string;
  availableLocations?: string[];
  deliveryRadius?: number;
  deliveryTime?: number;
  isFeatured?: boolean;
  isSeasonal?: boolean;
  tags?: string[];
  searchKeywords?: string[];
}

export interface UpdateProductData extends Partial<CreateProductData> {
  status?: Product['status'];
}

// Address Types
export interface Address {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  addressType: 'home' | 'work' | 'other';
  isActive: boolean;
  fullAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressData {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  addressType?: 'home' | 'work' | 'other';
  isDefault?: boolean;
}

export interface UpdateAddressData extends Partial<CreateAddressData> {}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// API service class
class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Authentication
  async register(userData: {
    name: string;
    email: string;
    password: string;
    role: 'buyer' | 'farmer';
    phone: string;
  }): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  }

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  }

  // Profile management
  async getProfile(): Promise<User> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async updateProfile(profileData: ProfileUpdateData): Promise<{ message: string; user: User }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  }

  async changePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passwordData),
    });
    return handleResponse(response);
  }

  async getStats(): Promise<{ stats: User['stats']; role: string }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/auth/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  // 2FA methods
  async setup2FA(): Promise<{ qrCode: string; backupCodes: string[]; secret: string }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/auth/2fa/setup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async verify2FA(token: string): Promise<{ message: string }> {
    const authToken = getAuthToken();
    if (!authToken) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/auth/2fa/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    return handleResponse(response);
  }

  async disable2FA(password: string): Promise<{ message: string }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/auth/2fa/disable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });
    return handleResponse(response);
  }

  async generateBackupCodes(): Promise<{ backupCodes: string[] }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/auth/2fa/backup-codes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async get2FAStatus(): Promise<{ enabled: boolean; backupCodesCount: number }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/auth/2fa/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  // File upload helper (for avatar)
  async uploadAvatar(file: File): Promise<{ url: string }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${this.baseURL}/auth/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return handleResponse(response);
  }

  // Payment Methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/payment-methods`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async addPaymentMethod(paymentData: AddPaymentMethodData): Promise<{ message: string; paymentMethod: PaymentMethod }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/payment-methods`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    return handleResponse(response);
  }

  async updatePaymentMethod(id: string, paymentData: Partial<AddPaymentMethodData>): Promise<{ message: string; paymentMethod: PaymentMethod }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/payment-methods/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    return handleResponse(response);
  }

  async deletePaymentMethod(id: string): Promise<{ message: string }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/payment-methods/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async setDefaultPaymentMethod(id: string): Promise<{ message: string }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/payment-methods/${id}/default`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  // Transactions
  async getTransactions(page: number = 1, limit: number = 10): Promise<TransactionResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/transactions?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async getTransactionById(id: string): Promise<Transaction> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/transactions/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  // Product Methods
  async getProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    organic?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
    farmer?: string;
  }): Promise<ProductResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${this.baseURL}/products?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async getProduct(id: string): Promise<Product> {
    const response = await fetch(`${this.baseURL}/products/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async getFeaturedProducts(limit: number = 6): Promise<{ products: Product[] }> {
    const response = await fetch(`${this.baseURL}/products/featured?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async searchProducts(params: {
    q: string;
    category?: string;
    organic?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
  }): Promise<{ products: Product[]; query: string }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseURL}/products/search?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async getFarmerProducts(farmerId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ProductResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${this.baseURL}/products/farmer/${farmerId}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async createProduct(productData: CreateProductData): Promise<{ message: string; product: Product }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    return handleResponse(response);
  }

  async updateProduct(id: string, productData: UpdateProductData): Promise<{ message: string; product: Product }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    return handleResponse(response);
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async uploadProductImages(id: string, files: File[]): Promise<{ message: string; images: Array<{ url: string; alt?: string; isPrimary: boolean }> }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await fetch(`${this.baseURL}/products/${id}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return handleResponse(response);
  }

  async deleteProductImage(id: string, imageId: string): Promise<{ message: string }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/products/${id}/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async updateProductStatus(id: string, status: Product['status'], reason?: string): Promise<{ message: string; product: Product }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/products/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, reason }),
    });
    return handleResponse(response);
  }

  // Order Methods
  async createOrder(orderData: {
    items: Array<{
      id: string;
      name: string;
      price: number;
      unit: string;
      quantity: number;
    }>;
    deliveryAddress: {
      fullName: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
      landmark?: string;
    };
    paymentMethod?: string;
    notes?: string;
  }): Promise<{ message: string; order: any }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    return handleResponse(response);
  }

  async getUserOrders(page: number = 1, limit: number = 10, status?: string): Promise<{ orders: any[]; pagination: any }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);

    const response = await fetch(`${this.baseURL}/orders/my-orders?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async getOrderById(id: string): Promise<any> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/orders/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async cancelOrder(id: string, reason: string): Promise<{ message: string; order: any }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/orders/${id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    return handleResponse(response);
  }

  // Address Methods
  async getAddresses(): Promise<{ addresses: Address[] }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/addresses`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async getAddress(id: string): Promise<{ address: Address }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/addresses/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async createAddress(addressData: CreateAddressData): Promise<{ message: string; address: Address }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/addresses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addressData),
    });
    return handleResponse(response);
  }

  async updateAddress(id: string, addressData: UpdateAddressData): Promise<{ message: string; address: Address }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/addresses/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addressData),
    });
    return handleResponse(response);
  }

  async deleteAddress(id: string): Promise<{ message: string }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/addresses/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async setDefaultAddress(id: string): Promise<{ message: string; address: Address }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/addresses/${id}/default`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  // Payment Methods
  async createPaymentOrder(data: {
    amount: number;
    currency?: string;
    orderId: string;
    description?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      orderId: string;
      amount: number;
      currency: string;
      key: string;
    };
  }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/payment/create-order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }

  async verifyPayment(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    orderId: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      order: any;
      paymentId: string;
    };
  }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/payment/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }

  async getPaymentStatus(orderId: string): Promise<{
    success: boolean;
    data: {
      paymentStatus: string;
      orderStatus: string;
      amount: number;
      currency: string;
    };
  }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/payment/status/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async cancelPayment(orderId: string): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/payment/cancel/${orderId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async getAvailablePaymentMethods(): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      methods: string[];
      isActive: boolean;
    }>;
  }> {
    const response = await fetch(`${this.baseURL}/payment/available-methods`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }
}

// Create and export the API service instance
export const apiService = new ApiService(API_BASE_URL);