import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { ShoppingBag, Plus, Edit3, Trash2, X } from 'lucide-react';
import { marketplace } from '../../services/api';

export default function Marketplace() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', price: '', quantity: '', unit: 'kg', category: '', farm_id: '', crop_id: '' });
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const cropName = searchParams.get('cropName');
    const farmId = searchParams.get('farmId');
    const cropId = searchParams.get('cropId');
    if (cropName || farmId) {
      setForm(prev => ({
        ...prev,
        title: cropName || prev.title,
        farm_id: farmId || prev.farm_id,
        crop_id: cropId || prev.crop_id
      }));
      setShowForm(true);
    }
  }, [searchParams]);

  const { data: listings, isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => marketplace.getMyListings().then(r => r.data)
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => marketplace.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      setShowForm(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => marketplace.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      setEditing(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => marketplace.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-listings'] })
  });

  const resetForm = () => setForm({ title: '', description: '', price: '', quantity: '', unit: 'kg', category: '', farm_id: '', crop_id: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(fd);
    }
  };

  const startEdit = (product: any) => {
    setEditing(product);
    setForm({
      title: product.title,
      description: product.description || '',
      price: String(product.price),
      quantity: String(product.quantity),
      unit: product.unit || 'kg',
      category: product.category || '',
      farm_id: product.farm_id || '',
      crop_id: product.crop_id || ''
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">My Marketplace</h1>
          <p className="text-gray-500 mt-1">Manage your product listings</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); resetForm(); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-lg">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" step="0.01" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                    <option>kg</option><option>g</option><option>ton</option><option>pieces</option><option>litre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
                  {editing ? 'Update' : 'Add'} Product
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-6 py-2 rounded-lg text-sm hover:bg-gray-100">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p>Loading listings...</p>
        </div>
      ) : !listings || listings.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ShoppingBag className="w-16 h-16 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No products listed</p>
          <p className="text-sm mt-1">Click "Add Product" to create your first listing</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((product: any) => (
            <div key={product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {product.product_images?.[0] && (
                <img src={product.product_images[0].image_url} alt={product.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{product.title}</h3>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    product.status === 'available' ? 'bg-green-100 text-green-700' :
                    product.status === 'out_of_stock' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{product.status.replace('_', ' ')}</span>
                </div>
                <p className="text-lg font-bold text-primary mt-2">₹{product.price.toLocaleString()} / {product.unit}</p>
                <p className="text-sm text-gray-500">Qty: {product.quantity}</p>
                {product.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button onClick={() => startEdit(product)} className="flex items-center gap-1 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg">
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => deleteMutation.mutate(product.id)} className="flex items-center gap-1 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
