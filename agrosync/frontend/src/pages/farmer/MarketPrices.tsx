import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, RefreshCw, Search, Filter, BarChart3 } from 'lucide-react';
import { marketPrices } from '../../services/api';

export default function MarketPrices() {
  const [searchCrop, setSearchCrop] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [showChart, setShowChart] = useState(false);

  const { data: prices, isLoading: pricesLoading, refetch, isFetching } = useQuery({
    queryKey: ['market-prices', searchCrop],
    queryFn: () => marketPrices.getAll({ crop: searchCrop || undefined }).then(r => r.data)
  });

  const { data: cropList } = useQuery({
    queryKey: ['market-crops'],
    queryFn: () => marketPrices.getCrops().then(r => r.data)
  });

  const { data: summary } = useQuery({
    queryKey: ['price-summary'],
    queryFn: () => marketPrices.getSummary().then(r => r.data)
  });

  const { data: priceHistory } = useQuery({
    queryKey: ['price-history', selectedCrop],
    queryFn: () => marketPrices.getHistory(selectedCrop).then(r => r.data),
    enabled: !!selectedCrop
  });

  const uniqueCrops = [...new Set((prices || []).map((p: any) => p.crop_name))];
  const uniqueMarkets = [...new Set((prices || []).map((p: any) => p.market_name))];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Market Prices</h1>
          <p className="text-gray-500 mt-1">Track real-time commodity prices across Indian markets</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowChart(!showChart)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100">
            <BarChart3 className="w-4 h-4" /> Price Trends
          </button>
          <button onClick={() => refetch()} disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh Prices
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">Total Crops</p>
          <p className="text-2xl font-bold">{uniqueCrops.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">Markets Tracked</p>
          <p className="text-2xl font-bold">{uniqueMarkets.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">Price Points</p>
          <p className="text-2xl font-bold">{prices?.length || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">Last Updated</p>
          <p className="text-lg font-bold">{prices?.[0]?.price_date || 'N/A'}</p>
        </div>
      </div>

      {showChart && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg">Price Trends</h2>
            <div className="flex gap-2">
              <select value={selectedCrop} onChange={e => setSelectedCrop(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
                <option value="">Select crop</option>
                {uniqueCrops.map((crop: string) => <option key={crop} value={crop}>{crop}</option>)}
              </select>
            </div>
          </div>
          {selectedCrop && priceHistory && priceHistory.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Current Avg</p>
                  <p className="text-xl font-bold">₹{priceHistory[0]?.price_per_quintal?.toLocaleString()}/qtl</p>
                </div>
                {priceHistory.length > 1 && (
                  <>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Min</p>
                      <p className="text-lg font-medium text-green-600">₹{Math.min(...priceHistory.map((p: any) => p.price_per_quintal)).toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Max</p>
                      <p className="text-lg font-medium text-red-600">₹{Math.max(...priceHistory.map((p: any) => p.price_per_quintal)).toLocaleString()}</p>
                    </div>
                    {priceHistory[0]?.price_per_quintal > priceHistory[1]?.price_per_quintal ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <TrendingUp className="w-4 h-4" /> Price Rising
                      </span>
                    ) : priceHistory[0]?.price_per_quintal < priceHistory[1]?.price_per_quintal ? (
                      <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                        <TrendingDown className="w-4 h-4" /> Price Falling
                      </span>
                    ) : null}
                  </>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Market</th>
                      <th className="pb-2 font-medium">State</th>
                      <th className="pb-2 font-medium text-right">Price (₹/qtl)</th>
                      <th className="pb-2 font-medium text-right">Min</th>
                      <th className="pb-2 font-medium text-right">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceHistory.map((p: any) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2">{p.price_date}</td>
                        <td className="py-2">{p.market_name}</td>
                        <td className="py-2 text-gray-600">{p.state}</td>
                        <td className="py-2 text-right font-medium">₹{p.price_per_quintal.toLocaleString()}</td>
                        <td className="py-2 text-right text-green-600">₹{(p.min_price || 0).toLocaleString()}</td>
                        <td className="py-2 text-right text-red-600">₹{(p.max_price || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              {selectedCrop ? 'Loading price history...' : 'Select a crop to view price trends'}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search crops..." value={searchCrop} onChange={e => setSearchCrop(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <span className="text-sm text-gray-500">{prices?.length || 0} results</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50">
                <th className="px-4 py-3 font-medium">Crop</th>
                <th className="px-4 py-3 font-medium">Market</th>
                <th className="px-4 py-3 font-medium">State</th>
                <th className="px-4 py-3 font-medium text-right">Price (₹/qtl)</th>
                <th className="px-4 py-3 font-medium text-right">Min</th>
                <th className="px-4 py-3 font-medium text-right">Max</th>
                <th className="px-4 py-3 font-medium text-right">Modal</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {pricesLoading ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading prices...</td></tr>
              ) : (prices || []).length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No prices found</td></tr>
              ) : (
                (prices || []).map((price: any) => {
                  const avg = (price.min_price + price.max_price) / 2;
                  const priceDiff = price.price_per_quintal - avg;
                  return (
                    <tr key={price.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{price.crop_name}</td>
                      <td className="px-4 py-3">{price.market_name}</td>
                      <td className="px-4 py-3 text-gray-600">{price.state}</td>
                      <td className="px-4 py-3 text-right font-medium">₹{price.price_per_quintal.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-green-600">₹{(price.min_price || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-red-600">₹{(price.max_price || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">₹{(price.modal_price || price.price_per_quintal).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500">{price.price_date}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
