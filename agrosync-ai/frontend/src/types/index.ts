export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'farmer' | 'buyer' | 'admin';
  status: 'pending' | 'active' | 'suspended';
  avatar_url?: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
}

export interface Farm {
  id: string;
  user_id: string;
  farm_name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  soil_type?: string;
  area?: number;
  area_unit?: string;
  farm_images?: FarmImage[];
  created_at: string;
}

export interface FarmImage {
  id: string;
  farm_id: string;
  image_url: string;
}

export interface Crop {
  id: string;
  crop_name: string;
  season?: string;
  soil_type?: string;
  ideal_temperature?: number;
  growth_duration?: number;
}

export interface UserCrop {
  id: string;
  farm_id: string;
  crop_id: string;
  crops?: Crop;
  planted_date: string;
  expected_harvest?: string;
  status: 'growing' | 'harvested' | 'failed';
  area_used?: number;
}

export interface CropRecommendation {
  id: string;
  farm_id: string;
  recommended_crop: string;
  confidence: number;
  reason?: string;
  weather_score?: number;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  wind_speed: number;
  forecast_date: string;
}

export interface MarketplaceProduct {
  id: string;
  farmer_id: string;
  farm_id?: string;
  crop_id?: string;
  title: string;
  description?: string;
  price: number;
  quantity: number;
  unit?: string;
  category?: string;
  status: 'available' | 'out_of_stock' | 'archived';
  product_images?: ProductImage[];
  crops?: Crop;
  users?: { name: string; avatar_url?: string; phone?: string };
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  farmer_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  total: number;
  notes?: string;
  order_items?: OrderItem[];
  users?: { name: string };
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  marketplace_products?: { title: string };
}

export interface Review {
  id: string;
  buyer_id: string;
  product_id: string;
  order_id?: string;
  rating: number;
  comment?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message?: string;
  type?: string;
  is_read: boolean;
  created_at: string;
}

export interface AnalyticsData {
  totalFarms?: number;
  totalProducts?: number;
  activeListings?: number;
  totalOrders?: number;
  totalRevenue?: number;
  cropsGrowing?: number;
  averageRating?: number;
  totalSpent?: number;
  completedOrders?: number;
}
