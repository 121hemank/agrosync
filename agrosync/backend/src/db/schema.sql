-- AgroSync AI Database Schema (Supabase/PostgreSQL)
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('farmer', 'buyer', 'admin')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farms table
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  farm_name VARCHAR(255) NOT NULL,
  location TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  soil_type VARCHAR(100),
  area DECIMAL(10, 2),
  area_unit VARCHAR(20) DEFAULT 'hectares',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farm images
CREATE TABLE farm_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crops reference table
CREATE TABLE crops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crop_name VARCHAR(255) NOT NULL,
  season VARCHAR(50),
  soil_type VARCHAR(100),
  ideal_temperature DECIMAL(5, 2),
  growth_duration INT,
  water_requirement VARCHAR(50)
);

-- User planted crops
CREATE TABLE user_crops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  crop_id UUID REFERENCES crops(id),
  planted_date DATE NOT NULL,
  expected_harvest DATE,
  status VARCHAR(50) DEFAULT 'growing' CHECK (status IN ('growing', 'harvested', 'failed')),
  area_used DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crop recommendations
CREATE TABLE crop_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  recommended_crop VARCHAR(255) NOT NULL,
  confidence DECIMAL(5, 2),
  reason TEXT,
  weather_score DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weather history
CREATE TABLE weather_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  temperature DECIMAL(5, 2),
  humidity DECIMAL(5, 2),
  rainfall DECIMAL(7, 2),
  wind_speed DECIMAL(5, 2),
  forecast_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Harvest predictions
CREATE TABLE harvest_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  crop_id UUID REFERENCES crops(id),
  expected_date DATE,
  expected_yield DECIMAL(10, 2),
  confidence DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace products
CREATE TABLE marketplace_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES farms(id),
  crop_id UUID REFERENCES crops(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'kg',
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'out_of_stock', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product images
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES marketplace_products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  total DECIMAL(12, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES marketplace_products(id),
  quantity DECIMAL(10, 2) NOT NULL,
  price DECIMAL(10, 2) NOT NULL
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES marketplace_products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'general',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics snapshots
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  revenue DECIMAL(12, 2) DEFAULT 0,
  profit DECIMAL(12, 2) DEFAULT 0,
  yield DECIMAL(10, 2) DEFAULT 0,
  orders_count INT DEFAULT 0,
  month INT,
  year INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  report_name VARCHAR(255),
  report_type VARCHAR(50),
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OTP table
CREATE TABLE otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crop calendar events
CREATE TABLE crop_calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  crop_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('planting', 'fertilizing', 'irrigation', 'pest_control', 'harvesting', 'other')),
  event_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  weather_alert BOOLEAN DEFAULT false,
  alert_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farm expenses
CREATE TABLE farm_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expense_category VARCHAR(50) NOT NULL CHECK (expense_category IN ('seeds', 'fertilizer', 'pesticide', 'labor', 'irrigation', 'equipment', 'transport', 'other')),
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  expense_date DATE NOT NULL,
  crop_id UUID REFERENCES crops(id),
  quantity DECIMAL(10, 2),
  unit VARCHAR(50),
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market prices
CREATE TABLE market_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crop_name VARCHAR(255) NOT NULL,
  market_name VARCHAR(255) NOT NULL,
  state VARCHAR(100),
  price_per_quintal DECIMAL(10, 2) NOT NULL,
  min_price DECIMAL(10, 2),
  max_price DECIMAL(10, 2),
  modal_price DECIMAL(10, 2),
  price_date DATE NOT NULL,
  unit VARCHAR(50) DEFAULT 'quintal',
  source VARCHAR(255) DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weather alerts
CREATE TABLE weather_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('frost', 'heatwave', 'heavy_rain', 'drought', 'storm', 'hailstorm', 'general')),
  severity VARCHAR(20) DEFAULT 'moderate' CHECK (severity IN ('low', 'moderate', 'high', 'critical')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  temperature DECIMAL(5, 2),
  humidity DECIMAL(5, 2),
  rainfall_mm DECIMAL(7, 2),
  wind_speed DECIMAL(5, 2),
  alert_date TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_farms_user ON farms(user_id);
CREATE INDEX idx_products_farmer ON marketplace_products(farmer_id);
CREATE INDEX idx_products_status ON marketplace_products(status);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_farmer ON orders(farmer_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_weather_farm ON weather_history(farm_id);
CREATE INDEX idx_user_crops_farm ON user_crops(farm_id);
CREATE INDEX idx_otps_email ON otps(email);
CREATE INDEX idx_calendar_farm ON crop_calendar_events(farm_id);
CREATE INDEX idx_calendar_date ON crop_calendar_events(event_date);
CREATE INDEX idx_calendar_user ON crop_calendar_events(user_id);
CREATE INDEX idx_expenses_farm ON farm_expenses(farm_id);
CREATE INDEX idx_expenses_user ON farm_expenses(user_id);
CREATE INDEX idx_expenses_date ON farm_expenses(expense_date);
CREATE INDEX idx_market_prices_crop ON market_prices(crop_name);
CREATE INDEX idx_market_prices_date ON market_prices(price_date);
CREATE INDEX idx_weather_alerts_farm ON weather_alerts(farm_id);
CREATE INDEX idx_weather_alerts_user ON weather_alerts(user_id);
CREATE INDEX idx_weather_alerts_unread ON weather_alerts(user_id, is_read);
