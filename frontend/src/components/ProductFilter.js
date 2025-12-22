import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Grid3x3, LayoutGrid, Filter } from "lucide-react";
import axios from "axios";
import { API } from "@/App";

const ProductFilter = ({ onFilterChange, activeFilters = {} }) => {
  const [categories, setCategories] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const badges = [
    { value: 'novidade', label: '✨ Novidade', color: 'bg-purple-100 text-purple-800 hover:bg-purple-200' },
    { value: 'lancamento', label: '🚀 Lançamento', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
    { value: 'custo-beneficio', label: '💰 Custo-Benefício', color: 'bg-green-100 text-green-800 hover:bg-green-200' },
    { value: 'top-linha', label: '👑 Top de Linha', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
    { value: 'oferta', label: '🔥 Oferta', color: 'bg-red-100 text-red-800 hover:bg-red-200' },
    { value: 'destaque', label: '⭐ Destaque', color: 'bg-orange-100 text-orange-800 hover:bg-orange-200' }
  ];

  const handleCategoryClick = (category) => {
    if (onFilterChange) {
      const newCategory = activeFilters.category === category ? null : category;
      onFilterChange({ ...activeFilters, category: newCategory });
    }
  };

  const handleBadgeClick = (badge) => {
    if (onFilterChange) {
      const newBadge = activeFilters.badge === badge ? null : badge;
      onFilterChange({ ...activeFilters, badge: newBadge });
    }
  };

  const clearFilters = () => {
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  const hasActiveFilters = activeFilters.category || activeFilters.badge;

  return (
    <div className="mb-8">
      {/* Mobile Toggle Button */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros {hasActiveFilters && `(${Object.keys(activeFilters).filter(k => activeFilters[k]).length})`}
        </Button>
      </div>

      {/* Filters Container */}
      <div className={`${isOpen ? 'block' : 'hidden'} lg:block`}>
        <Card className="p-6">
          <div className="space-y-6">
            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 pb-4 border-b">
                <span className="text-sm font-medium">Filtros ativos:</span>
                {activeFilters.category && (
                  <Badge variant="secondary" className="gap-1">
                    {activeFilters.category}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-red-600" 
                      onClick={() => handleCategoryClick(activeFilters.category)}
                    />
                  </Badge>
                )}
                {activeFilters.badge && (
                  <Badge variant="secondary" className="gap-1">
                    {badges.find(b => b.value === activeFilters.badge)?.label}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-red-600" 
                      onClick={() => handleBadgeClick(activeFilters.badge)}
                    />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="ml-auto text-xs"
                >
                  Limpar tudo
                </Button>
              </div>
            )}

            {/* Categories */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <LayoutGrid className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-lg">Categorias</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {categories.map((category) => {
                  // Handle both object and string formats
                  const categorySlug = typeof category === 'object' ? category.slug : category;
                  const categoryName = typeof category === 'object' ? category.name : category;
                  const categoryId = typeof category === 'object' ? category.id : category;
                  
                  return (
                    <Button
                      key={categoryId}
                      variant={activeFilters.category === categorySlug ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => handleCategoryClick(categorySlug)}
                    >
                      {categoryName}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Badges */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Grid3x3 className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-lg">Destaques</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <button
                    key={badge.value}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer
                      ${activeFilters.badge === badge.value 
                        ? `${badge.color} ring-2 ring-offset-2 ring-blue-500 scale-105` 
                        : `${badge.color} hover:scale-105`
                      }`}
                    onClick={() => handleBadgeClick(badge.value)}
                  >
                    {badge.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProductFilter;
