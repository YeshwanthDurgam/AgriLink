import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Shield,
  ShieldOff,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Package,
  IndianRupee
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'farmer' | 'buyer' | 'admin';
  avatar?: string;
  location?: string;
  joinDate: string;
  isVerified: boolean;
  status: 'active' | 'suspended' | 'pending';
  stats?: {
    ordersPlaced?: number;
    totalSpent?: number;
    productsListed?: number;
    totalOrders?: number;
    averageRating?: number;
    monthlyRevenue?: number;
  };
}

const AdminUserManagement = () => {
  const [farmers, setFarmers] = useState<User[]>([]);
  const [buyers, setBuyers] = useState<User[]>([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [loadingBuyers, setLoadingBuyers] = useState(true);
  const [errorFarmers, setErrorFarmers] = useState('');
  const [errorBuyers, setErrorBuyers] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all');

  // Fetch farmers
  useEffect(() => {
    const fetchFarmers = async () => {
      setLoadingFarmers(true);
      setErrorFarmers('');
      try {
        const res = await apiService.get('/admin/farmers?page=1&limit=50');
        if (res.success) {
          setFarmers(res.data.docs || []);
        } else {
          setErrorFarmers(res.message || 'Failed to fetch farmers');
        }
      } catch (err: any) {
        setErrorFarmers(err.message || 'Failed to fetch farmers');
      } finally {
        setLoadingFarmers(false);
      }
    };
    fetchFarmers();
  }, []);

  // Fetch buyers
  useEffect(() => {
    const fetchBuyers = async () => {
      setLoadingBuyers(true);
      setErrorBuyers('');
      try {
        const res = await apiService.get('/admin/customers?page=1&limit=50');
        if (res.success) {
          setBuyers(res.data.docs || []);
        } else {
          setErrorBuyers(res.message || 'Failed to fetch buyers');
        }
      } catch (err: any) {
        setErrorBuyers(err.message || 'Failed to fetch buyers');
      } finally {
        setLoadingBuyers(false);
      }
    };
    fetchBuyers();
  }, []);

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'verify', userType: 'farmer' | 'buyer') => {
    try {
      const endpoint = userType === 'farmer' 
        ? `/admin/farmers/${userId}/${action}`
        : `/admin/customers/${userId}/${action}`;
      
      await apiService.post(endpoint);
      
      // Update local state
      const updateUser = (users: User[]) => 
        users.map(user => 
          user._id === userId 
            ? { 
                ...user, 
                status: action === 'suspend' ? 'suspended' : 'active',
                isVerified: action === 'verify' ? true : user.isVerified
              }
            : user
        );
      
      if (userType === 'farmer') {
        setFarmers(updateUser);
      } else {
        setBuyers(updateUser);
      }
      
      toast.success(`User ${action}d successfully`);
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  const filteredFarmers = farmers.filter(farmer => {
    const matchesSearch = farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         farmer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || farmer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredBuyers = buyers.filter(buyer => {
    const matchesSearch = buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         buyer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || buyer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const UserCard = ({ user, userType }: { user: User; userType: 'farmer' | 'buyer' }) => (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
            ) : (
              <span className="text-lg font-semibold text-gray-600">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold">{user.name}</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusColor(user.status)}>
                {user.status}
              </Badge>
              {user.isVerified && (
                <Badge className="bg-blue-100 text-blue-800">
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="w-4 h-4" />
          {user.phone}
        </div>
        {user.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            {user.location}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          {new Date(user.joinDate).toLocaleDateString()}
        </div>
        {user.stats && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {userType === 'farmer' ? (
              <>
                <Package className="w-4 h-4" />
                {user.stats.productsListed || 0} products
              </>
            ) : (
              <>
                <IndianRupee className="w-4 h-4" />
                ₹{user.stats.totalSpent || 0}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {user.status === 'active' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleUserAction(user._id, 'suspend', userType)}
            className="text-red-600 hover:text-red-700"
          >
            <ShieldOff className="w-4 h-4 mr-1" />
            Suspend
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleUserAction(user._id, 'activate', userType)}
            className="text-green-600 hover:text-green-700"
          >
            <Shield className="w-4 h-4 mr-1" />
            Activate
          </Button>
        )}
        {!user.isVerified && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleUserAction(user._id, 'verify', userType)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Shield className="w-4 h-4 mr-1" />
            Verify
          </Button>
        )}
        <Button size="sm" variant="outline">
          <Mail className="w-4 h-4 mr-1" />
          Contact
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
        <p className="text-gray-600">Manage farmers and buyers, monitor activity, and ensure platform quality</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{farmers.length}</div>
            <p className="text-sm text-gray-600">Total Farmers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShoppingCart className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{buyers.length}</div>
            <p className="text-sm text-gray-600">Total Buyers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {farmers.filter(f => f.isVerified).length + buyers.filter(b => b.isVerified).length}
            </div>
            <p className="text-sm text-gray-600">Verified Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {farmers.filter(f => f.status === 'active').length + buyers.filter(b => b.status === 'active').length}
            </div>
            <p className="text-sm text-gray-600">Active Users</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="farmers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="farmers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Farmers ({farmers.length})
          </TabsTrigger>
          <TabsTrigger value="buyers" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Buyers ({buyers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="farmers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Farmer Management</CardTitle>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search farmers..."
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
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingFarmers ? (
                <div className="text-center py-8 text-gray-500">Loading farmers...</div>
              ) : errorFarmers ? (
                <div className="text-center py-8 text-red-500">{errorFarmers}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFarmers.map((farmer) => (
                    <UserCard key={farmer._id} user={farmer} userType="farmer" />
                  ))}
                  {filteredFarmers.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p>No farmers found</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buyers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Buyer Management</CardTitle>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search buyers..."
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
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingBuyers ? (
                <div className="text-center py-8 text-gray-500">Loading buyers...</div>
              ) : errorBuyers ? (
                <div className="text-center py-8 text-red-500">{errorBuyers}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBuyers.map((buyer) => (
                    <UserCard key={buyer._id} user={buyer} userType="buyer" />
                  ))}
                  {filteredBuyers.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p>No buyers found</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUserManagement; 