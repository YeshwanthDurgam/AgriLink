
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, MapPin, Package, Award, Search, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, User } from '@/lib/api';

const Farmers = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get authenticated user for location
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [specialityFilter, setSpecialityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [displayMode, setDisplayMode] = useState('local'); // 'local' or 'all'
  const [farmers, setFarmers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch farmers based on filters
  const fetchFarmers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {
        search: searchQuery,
        sortBy: sortBy,
      };

      // Always fetch all farmers from backend, then filter on frontend
      const response = await apiService.getFarmers({ search: searchQuery, sortBy: sortBy });
      let fetchedFarmers = response.farmers;
      
      setFarmers(fetchedFarmers);
    } catch (err) {
      console.error('Error fetching farmers:', err);
      setError(`Failed to load farmers: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy]); // Removed displayMode, locationFilter, specialityFilter, user?.location from dependencies

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  // Filter out empty/undefined values for Select options, ensuring no empty strings
  const states = [...new Set(farmers.map(farmer => farmer.farmLocation).filter(loc => loc && loc !== ''))];
  const specialities = [...new Set(farmers.flatMap(farmer => (farmer.specialties || []).filter(spec => spec && spec !== '')))];

  // Apply filters and sort to farmers for rendering
  const displayedFarmers = farmers
    .filter(farmer => {
      const matchesSearch = searchQuery === '' || 
        (farmer.name && farmer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (farmer.farmLocation && farmer.farmLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (farmer.specialties && farmer.specialties.some((spec: string) => spec.toLowerCase().includes(searchQuery.toLowerCase())));
      
      let matchesLocation = true;
      if (displayMode === 'local') {
        matchesLocation = user?.location === farmer.farmLocation; // Match user's location
      } else if (locationFilter !== 'all') {
        matchesLocation = farmer.farmLocation === locationFilter; // Match selected filter
      }

      const matchesSpeciality = specialityFilter !== 'all' ? (farmer.specialties && farmer.specialties.includes(specialityFilter)) : true;
      
      return matchesSearch && matchesLocation && matchesSpeciality;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating': return (b.averageRating || 0) - (a.averageRating || 0);
        case 'products': return (b.products?.length || 0) - (a.products?.length || 0);
        default: return 0;
      }
    });

  const handleFarmerClick = (farmerId: string) => {
    navigate(`/farmers/${farmerId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Helmet>
        <title>Local Farmers | AgriDirect</title>
        <meta name="description" content="Connect directly with verified farmers across India." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm mb-4" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex text-gray-500">
            <li className="flex items-center">
              <Link to="/" className="hover:text-green-600">Home</Link>
              <span className="mx-2">/</span>
            </li>
            <li className="text-green-700 font-semibold">Local Farmers</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">👨‍🌾 Our Farmers</h1>
          <p className="text-gray-600">Connect directly with verified farmers across India</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search farmers, locations, specialties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={displayMode} onValueChange={setDisplayMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Display Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local Farmers</SelectItem>
                  <SelectItem value="all">All Farmers</SelectItem>
                </SelectContent>
              </Select>

              <Select value={locationFilter} onValueChange={setLocationFilter} disabled={displayMode === 'local'}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {states.map(state => (
                    state && state !== '' ? <SelectItem key={state} value={state}>{state}</SelectItem> : null
                  ))}
                </SelectContent>
              </Select>

              <Select value={specialityFilter} onValueChange={setSpecialityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Specialties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  {specialities.map(spec => (
                    spec && spec !== '' ? <SelectItem key={spec} value={spec}>{spec}</SelectItem> : null
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="products">Most Products</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {displayedFarmers.length} farmer{displayedFarmers.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
            {displayMode === 'local' && user?.location && ` near ${user.location}`}
            {locationFilter !== 'all' && ` in ${locationFilter}`}
            {specialityFilter !== 'all' && ` specializing in ${specialityFilter}`}
          </p>
        </div>

        {/* Farmers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-red-500">
                <p className="text-lg font-medium mb-2">{error}</p>
                <p>Try again later.</p>
              </div>
            </CardContent>
          </Card>
        ) : displayedFarmers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-gray-500">
                <p className="text-lg font-medium mb-2">No farmers found</p>
                <p>Try adjusting your search criteria</p>
              </div>
            </CardContent>
          </Card>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedFarmers.map((farmer) => (
            <Card 
                key={farmer._id} 
              className="hover:shadow-lg transition-shadow cursor-pointer border-green-100"
                onClick={() => handleFarmerClick(farmer._id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-3">
                  <img
                      src={farmer.avatar || '/placeholder.svg'}
                    alt={farmer.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <CardTitle className="text-lg">{farmer.name}</CardTitle>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                        {farmer.farmLocation}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{farmer.averageRating?.toFixed(1) || 'N/A'}</span>
                  </div>
                  
                  <div className="flex gap-1">
                    {farmer.isVerified && (
                      <Badge className="bg-green-100 text-green-800">
                        <Award className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div>
                      <p className="text-sm text-gray-600 mb-1">Specialties:</p>
                    <div className="flex flex-wrap gap-1">
                        {(farmer.specialties || []).slice(0, 2).map((spec: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                        {farmer.specialties && farmer.specialties.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                            +{farmer.specialties.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-1 text-gray-400" />
                        <span>{farmer.products?.length || 0} Products</span>
                    </div>
                  </div>

                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                        handleFarmerClick(farmer._id);
                    }}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    View Profile & Products
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}
      </div>
    </div>
  );
};

export default Farmers;
