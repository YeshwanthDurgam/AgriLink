
import { useEffect, useState } from 'react';
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { Timer, Percent, Star, TrendingDown } from "lucide-react";
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';

const Deals = () => {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch('/api/products?deal=true')
      .then(res => res.json())
      .then(data => {
        if (data.success) setDeals(data.products);
        else setError('Failed to load deals.');
      })
      .catch(() => setError('Failed to load deals.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Helmet>
        <title>Today's Deals | AgriDirect</title>
        <meta name="description" content="Limited time offers on fresh produce - save big while supporting local farmers!" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm mb-4" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex text-gray-500">
            <li className="flex items-center">
              <Link to="/" className="hover:text-green-600">Home</Link>
              <span className="mx-2">/</span>
            </li>
            <li className="text-green-700 font-semibold">Today's Deals</li>
          </ol>
        </nav>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🔥 Hot Deals & Offers</h1>
          <p className="text-xl text-gray-600">
            Limited time offers on fresh produce - save big while supporting local farmers!
          </p>
        </div>

        {/* Deal Types */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center border-red-200">
            <CardContent className="p-4">
              <Timer className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h3 className="font-semibold text-red-700">Flash Deals</h3>
              <p className="text-sm text-gray-600">Limited time offers</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-blue-200">
            <CardContent className="p-4">
              <Star className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-700">Weekly Specials</h3>
              <p className="text-sm text-gray-600">Best deals of the week</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-purple-200">
            <CardContent className="p-4">
              <Percent className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-700">Bulk Discounts</h3>
              <p className="text-sm text-gray-600">Save more on large orders</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-green-200">
            <CardContent className="p-4">
              <TrendingDown className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-green-700">Seasonal Offers</h3>
              <p className="text-sm text-gray-600">Best prices in season</p>
            </CardContent>
          </Card>
        </div>

        {/* Featured Deals */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Deals</h2>
          {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-lg" />
              ))}
                </div>
          ) : error ? (
            <div className="text-center text-red-500 py-12">{error}</div>
          ) : deals.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No deals available right now.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map(deal => (
                <ProductCard key={deal.id} product={deal} showDealBadge />
            ))}
          </div>
          )}
        </div>

        {/* Newsletter Signup */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900">Never Miss a Deal!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              Subscribe to our newsletter and be the first to know about exclusive deals and offers.
            </p>
            <div className="flex max-w-md mx-auto gap-2">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Button className="bg-green-600 hover:bg-green-700">
                Subscribe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Deals;
