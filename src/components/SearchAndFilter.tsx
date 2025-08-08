import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";

interface SearchAndFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filters: FilterOptions) => void;
  categories: string[];
  locations: string[];
  facetCounts?: { categories?: Array<{ value: string; count: number }>; locations?: Array<{ value: string; count: number }> };
}

interface FilterOptions {
  category: string;
  location: string;
  priceRange: [number, number];
  sortBy: string;
}

const SearchAndFilter = ({ onSearch, onFilter, categories, locations, facetCounts }: SearchAndFilterProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    category: "all",
    location: "all",
    priceRange: [0, 1000],
    sortBy: "newest"
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
    updateActiveFilters(newFilters);
  };

  const updateActiveFilters = (currentFilters: FilterOptions) => {
    const active: string[] = [];
    if (currentFilters.category && currentFilters.category !== 'all') active.push(`Category: ${currentFilters.category}`);
    if (currentFilters.location && currentFilters.location !== 'all') active.push(`Location: ${currentFilters.location}`);
    if (currentFilters.priceRange[0] > 0 || currentFilters.priceRange[1] < 1000) {
      active.push(`Price: ₹${currentFilters.priceRange[0]} - ₹${currentFilters.priceRange[1]}`);
    }
    if (currentFilters.sortBy !== "newest") active.push(`Sort: ${currentFilters.sortBy}`);
    setActiveFilters(active);
  };

  const clearFilter = (filterText: string) => {
    const newFilters = { ...filters };
    if (filterText.startsWith("Category:")) newFilters.category = "all";
    if (filterText.startsWith("Location:")) newFilters.location = "all";
    if (filterText.startsWith("Price:")) newFilters.priceRange = [0, 1000];
    if (filterText.startsWith("Sort:")) newFilters.sortBy = "newest";
    
    setFilters(newFilters);
    onFilter(newFilters);
    updateActiveFilters(newFilters);
  };

  const clearAllFilters = () => {
    const defaultFilters = {
      category: "all",
      location: "all",
      priceRange: [0, 1000] as [number, number],
      sortBy: "newest"
    };
    setFilters(defaultFilters);
    onFilter(defaultFilters);
    setActiveFilters([]);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products, farmers, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSearch} className="flex-1 sm:flex-none">Search</Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            <span className="sm:hidden">Filter</span>
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs sm:text-sm text-gray-600">Active filters:</span>
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1 text-xs">
              <span className="truncate max-w-24 sm:max-w-none">{filter}</span>
              <X
                className="h-3 w-3 cursor-pointer flex-shrink-0"
                onClick={() => clearFilter(filter)}
              />
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs sm:text-sm">
            Clear all
          </Button>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Filter Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 block">Category</label>
                <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                  <SelectTrigger className="text-xs sm:text-sm">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => {
                      const count = facetCounts?.categories?.find(c => (c.value || '').toLowerCase() === category.toLowerCase())?.count;
                      return (
                        <SelectItem key={category} value={category}>
                          {category}{typeof count === 'number' ? ` (${count})` : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 block">Location</label>
                <Select value={filters.location} onValueChange={(value) => handleFilterChange("location", value)}>
                  <SelectTrigger className="text-xs sm:text-sm">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    {locations.map((location) => {
                      const count = facetCounts?.locations?.find(c => (c.value || '') == null ? false : (c.value || '').toLowerCase() === location.toLowerCase())?.count;
                      return (
                        <SelectItem key={location} value={location}>
                          {location}{typeof count === 'number' ? ` (${count})` : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 block">Sort By</label>
                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                  <SelectTrigger className="text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 block">
                  Price Range: ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                </label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => handleFilterChange("priceRange", value as [number, number])}
                  max={1000}
                  min={0}
                  step={10}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchAndFilter;
