import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Leaf, Apple, Wheat, Droplets, Sprout, Milk } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  count: number;
  featured: string[];
}

interface CategoryCount {
  category: string;
  count: number;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([
    {
      id: "vegetables",
      name: "Vegetables",
      description: "Fresh organic vegetables from local farms",
      icon: Leaf,
      color: "bg-green-100 text-green-800",
      count: 45,
      featured: ["Tomatoes", "Spinach", "Carrots", "Potatoes"]
    },
    {
      id: "fruits",
      name: "Fruits",
      description: "Seasonal fresh fruits directly from orchards",
      icon: Apple,
      color: "bg-red-100 text-red-800",
      count: 32,
      featured: ["Apples", "Mangoes", "Bananas", "Oranges"]
    },
    {
      id: "grains",
      name: "Grains & Cereals",
      description: "Quality grains and cereals for your kitchen",
      icon: Wheat,
      color: "bg-yellow-100 text-yellow-800",
      count: 28,
      featured: ["Rice", "Wheat", "Barley", "Quinoa"]
    },
    {
      id: "herbs",
      name: "Herbs & Spices",
      description: "Aromatic herbs and spices for cooking",
      icon: Sprout,
      color: "bg-purple-100 text-purple-800",
      count: 24,
      featured: ["Basil", "Coriander", "Mint", "Turmeric"]
    },
    {
      id: "dairy",
      name: "Dairy Products",
      description: "Fresh dairy products from local farms",
      icon: Milk,
      color: "bg-blue-100 text-blue-800",
      count: 18,
      featured: ["Milk", "Cheese", "Yogurt", "Butter"]
    },
    {
      id: "seeds",
      name: "Seeds & Nuts",
      description: "Premium seeds and nuts for planting and consumption",
      icon: Droplets,
      color: "bg-orange-100 text-orange-800",
      count: 21,
      featured: ["Sunflower Seeds", "Almonds", "Walnuts", "Peanuts"]
    },
  ]);

  useEffect(() => {
    const fetchCategoryCounts = async () => {
      try {
        const response = await fetch('/api/analytics/category-counts');
        if (!response.ok) {
          throw new Error('Failed to fetch category counts');
        }
        const counts: CategoryCount[] = await response.json();
        
        setCategories(prevCategories => 
          prevCategories.map(cat => {
            const match = counts.find(c => c.category.toLowerCase().includes(cat.id.slice(0, -1)));
            return match ? { ...cat, count: match.count } : cat;
          })
        );
      } catch (error) {
        console.error("Error fetching category counts:", error);
      }
    };

    fetchCategoryCounts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shop by Categories</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover fresh, quality products organized by category. From farm to table, 
            find exactly what you're looking for.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card key={category.id} className="hover:shadow-lg transition-shadow duration-300 border-green-100">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <IconComponent className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl font-bold">{category.name}</CardTitle>
                  <Badge className={category.color}>
                    {category.count} Products
                  </Badge>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-4">{category.description}</p>
                  
                  <div className="mb-6">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Featured Items:</h4>
                    <div className="flex flex-wrap justify-center gap-2">
                      {category.featured.map((item) => (
                        <Badge key={item} variant="outline" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Link to={`/category/${category.id}`}>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Browse {category.name}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="bg-green-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Can't find what you're looking for?
          </h2>
          <p className="text-gray-600 mb-6">
            Browse our complete marketplace or contact our farmers directly for custom orders.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/marketplace">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                Browse All Products
              </Button>
            </Link>
            <Link to="/support">
              <Button size="lg" variant="outline">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;
