import { Link } from 'react-router-dom';
import { Sprout, CloudSun, ShoppingBag, BarChart3, TrendingUp, ClipboardList } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 lg:px-12 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sprout className="w-7 h-7 text-primary" />
          <span className="font-heading font-bold text-xl text-primary">AgroSync</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary">Login</Link>
          <Link to="/register" className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-700">Get Started</Link>
        </div>
      </nav>

      <section className="px-6 lg:px-12 py-20 lg:py-32 max-w-7xl mx-auto">
        <div className="max-w-3xl">
          <h1 className="font-heading text-4xl lg:text-6xl font-bold text-text leading-tight">
            Where Soil Meets{' '}
            <span className="text-primary">Opportunity</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 leading-relaxed">
            AgroSync connects farmers and buyers in one powerful marketplace. Manage your farm, track weather and market prices, and grow your business — all from a single platform.
          </p>
          <div className="flex gap-4 mt-8">
            <Link to="/register" className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700">Get Started</Link>
            <Link to="/login" className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50">Login</Link>
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-12 py-16 bg-surface">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-center mb-12">Everything You Need</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Sprout, title: 'Farm Management', desc: 'Manage your farms, crops, and harvests all in one place' },
              { icon: CloudSun, title: 'Weather Insights', desc: 'Real-time weather data and forecasts for your farm location' },
              { icon: ShoppingBag, title: 'Marketplace', desc: 'Buy and sell farm produce directly — no middlemen' },
              { icon: TrendingUp, title: 'Revenue Tracking', desc: 'Track profits, orders, and overall farm performance' },
              { icon: BarChart3, title: 'Market Prices', desc: 'Stay updated with real-time commodity prices' },
              { icon: ClipboardList, title: 'Smart Planning', desc: 'Plan your crops and seasons with data-driven insights' }
            ].map((f, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                <f.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-6 lg:px-12 py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-500">
          <span>&copy; 2026 AgroSync. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/about" className="hover:text-primary">About</Link>
            <Link to="/contact" className="hover:text-primary">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
