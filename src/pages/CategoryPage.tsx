import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Leaf, Apple, Wheat, Droplets, Sprout, Milk } from 'lucide-react';
import { apiService } from '@/lib/api';

const CATEGORY_META = {
  vegetables: {
    name: 'Vegetables',
    icon: Leaf,
    color: 'bg-green-100 text-green-800',
    banner: 'Discover the freshest vegetables from local farms.'
  },
  fruits: {
    name: 'Fruits',
    icon: Apple,
    color: 'bg-red-100 text-red-800',
    banner: 'Juicy, seasonal fruits delivered to your door.'
  },
  dairy: {
    name: 'Dairy',
    icon: Milk,
    color: 'bg-blue-100 text-blue-800',
    banner: 'Fresh dairy products from local farms.'
  },
  grains: {
    name: 'Grains',
    icon: Wheat,
    color: 'bg-yellow-100 text-yellow-800',
    banner: 'Quality grains and cereals for your kitchen.'
  },
  seeds: {
    name: 'Seeds',
    icon: Droplets,
    color: 'bg-orange-100 text-orange-800',
    banner: 'Premium seeds and nuts for planting and consumption.'
  },
  herbs: {
    name: 'Herbs & Spices',
    icon: Sprout,
    color: 'bg-purple-100 text-purple-800',
    banner: 'Aromatic herbs and spices for your culinary creations.'
  }
};

const CategoryPage = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const meta = CATEGORY_META[categoryName as keyof typeof CATEGORY_META] || {
    name: categoryName,
    icon: Leaf,
    color: 'bg-gray-100 text-gray-800',
    banner: ''
  };
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    const fetchProducts = async () => {
      try {
        const response = await apiService.getProducts({ category: meta.name });
        if (response.products) {
          setProducts(response.products);
        } else {
          setError('Failed to load products.');
        }
      } catch (err) {
        setError('Failed to load products.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryName, meta.name]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{meta.name} | AgriDirect</title>
        <meta name="description" content={meta.banner} />
      </Helmet>
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm mb-4" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex text-gray-500">
            <li className="flex items-center">
              <Link to="/" className="hover:text-green-600">Home</Link>
              <span className="mx-2">/</span>
            </li>
            <li className="flex items-center">
              <Link to="/categories" className="hover:text-green-600">Category</Link>
              <span className="mx-2">/</span>
            </li>
            <li className="text-green-700 font-semibold">{meta.name}</li>
          </ol>
        </nav>
        {/* Banner */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${meta.color}`}>
            <meta.icon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{meta.name}</h1>
            <p className="text-gray-600">{meta.banner}</p>
          </div>
        </div>
        {/* Sorting/filtering can be added here */}
        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No products found in this category.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage; 