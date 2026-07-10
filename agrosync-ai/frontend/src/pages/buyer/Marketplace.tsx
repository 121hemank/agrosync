import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Filter, Plus, Minus, Star, X } from 'lucide-react';
import { marketplace, orders } from '../../services/api';

export default function BuyerMarketplace() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  const { data: products, isLoading } = useQuery({
    queryKey: ['marketplace', search, category],
    queryFn: () => marketplace.getAll({ search, category: category || undefined }).then(r => r.data)
  });

  const orderMutation = useMutation({
    mutationFn: (data: any) => orders.create(data),
    onSuccess: () => navigate('/buyer/orders')
  });

  const handleOrderNow = () => {
    if (!selectedProduct) return;
    orderMutation.mutate({
      items: [{ product_id: selectedProduct.id, quantity }]
    });
  };

  const categories = [...new Set((products || []).map((p: any) => p.category).filter(Boolean))];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Marketplace</h1>
          <p className="text-gray-500 mt-1">Browse and buy fresh farm products</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm appearance-none bg-white">
            <option value="">All Categories</option>
            {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p>Loading products...</p>
        </div>
      ) : !products || products.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ShoppingBag className="w-16 h-16 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product: any) => (
            <div key={product.id} onClick={() => { setSelectedProduct(product); setQuantity(1); }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
              {product.product_images?.[0] ? (
                <img src={product.product_images[0].image_url} alt={product.title} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10 text-gray-300" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold truncate">{product.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{product.users?.name || 'Farmer'}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-lg font-bold text-primary">₹{product.price.toLocaleString()}<span className="text-sm font-normal text-gray-400">/{product.unit || 'kg'}</span></p>
                  <span className="text-xs text-gray-500">Qty: {product.quantity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-lg">{selectedProduct.title}</h2>
              <button onClick={() => setSelectedProduct(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {selectedProduct.product_images?.[0] ? (
                  <img src={selectedProduct.product_images[0].image_url} alt={selectedProduct.title} className="w-full h-56 object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-56 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                {selectedProduct.product_images?.length > 1 && (
                  <div className="flex gap-2 mt-2">
                    {selectedProduct.product_images.slice(1, 4).map((img: any) => (
                      <img key={img.id} src={img.image_url} alt="" className="w-16 h-16 object-cover rounded-lg" />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-400">{selectedProduct.users?.name || 'Farmer'}</p>
                <p className="text-3xl font-bold text-primary mt-2">₹{selectedProduct.price.toLocaleString()} <span className="text-base font-normal text-gray-400">/{selectedProduct.unit || 'kg'}</span></p>
                {selectedProduct.category && (
                  <span className="inline-block mt-2 text-xs bg-primary-50 text-primary px-2.5 py-1 rounded-full">{selectedProduct.category}</span>
                )}
                {selectedProduct.description && (
                  <p className="text-sm text-gray-600 mt-3">{selectedProduct.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">Available quantity: {selectedProduct.quantity}</p>

                <div className="flex items-center gap-3 mt-4">
                  <span className="text-sm font-medium text-gray-700">Quantity:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1.5 hover:bg-gray-100"><Minus className="w-4 h-4" /></button>
                    <span className="px-4 py-1.5 text-sm font-medium border-x border-gray-300">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(selectedProduct.quantity, quantity + 1))} className="p-1.5 hover:bg-gray-100"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button onClick={handleOrderNow} disabled={orderMutation.isPending}
                    className="flex-1 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                    {orderMutation.isPending ? 'Ordering...' : 'Order Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
