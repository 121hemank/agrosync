-- RLS Policies for AgroSync AI
-- Run AFTER schema.sql
-- IMPORTANT: Backend uses service_role key which BYPASSES RLS automatically.
-- These policies are only needed if you ever query Supabase directly with anon key.

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;

-- ==============================
-- PUBLIC READ-ONLY POLICIES
-- ==============================

DROP POLICY IF EXISTS "crops are publicly readable" ON crops;
CREATE POLICY "crops are publicly readable" ON crops FOR SELECT USING (true);

DROP POLICY IF EXISTS "available products are publicly readable" ON marketplace_products;
CREATE POLICY "available products are publicly readable" ON marketplace_products
  FOR SELECT USING (status = 'available');

DROP POLICY IF EXISTS "product images are publicly readable" ON product_images;
CREATE POLICY "product images are publicly readable" ON product_images FOR SELECT USING (true);

-- ==============================
-- AUTHENTICATED USER POLICIES
-- ==============================

DROP POLICY IF EXISTS "users can read own record" ON users;
CREATE POLICY "users can read own record" ON users
  FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS "users can update own record" ON users;
CREATE POLICY "users can update own record" ON users
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "users can manage own refresh tokens" ON refresh_tokens;
CREATE POLICY "users can manage own refresh tokens" ON refresh_tokens
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "farmers can manage own farms" ON farms;
CREATE POLICY "farmers can manage own farms" ON farms
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "farm images follow farm access" ON farm_images;
CREATE POLICY "farm images follow farm access" ON farm_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM farms WHERE farms.id = farm_images.farm_id AND farms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "farmers can manage own crops" ON user_crops;
CREATE POLICY "farmers can manage own crops" ON user_crops
  FOR ALL USING (
    EXISTS (SELECT 1 FROM farms WHERE farms.id = user_crops.farm_id AND farms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "farmers can view own recommendations" ON crop_recommendations;
CREATE POLICY "farmers can view own recommendations" ON crop_recommendations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM farms WHERE farms.id = crop_recommendations.farm_id AND farms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "farmers can view own weather" ON weather_history;
CREATE POLICY "farmers can view own weather" ON weather_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM farms WHERE farms.id = weather_history.farm_id AND farms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "farmers can view own harvest predictions" ON harvest_predictions;
CREATE POLICY "farmers can view own harvest predictions" ON harvest_predictions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM farms WHERE farms.id = harvest_predictions.farm_id AND farms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "farmers can manage own products" ON marketplace_products;
CREATE POLICY "farmers can manage own products" ON marketplace_products
  FOR INSERT WITH CHECK (farmer_id = auth.uid());
DROP POLICY IF EXISTS "farmers can update own products" ON marketplace_products;
CREATE POLICY "farmers can update own products" ON marketplace_products
  FOR UPDATE USING (farmer_id = auth.uid());
DROP POLICY IF EXISTS "farmers can delete own products" ON marketplace_products;
CREATE POLICY "farmers can delete own products" ON marketplace_products
  FOR DELETE USING (farmer_id = auth.uid());

DROP POLICY IF EXISTS "product images follow product ownership" ON product_images;
CREATE POLICY "product images follow product ownership" ON product_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM marketplace_products WHERE marketplace_products.id = product_images.product_id AND marketplace_products.farmer_id = auth.uid())
  );

DROP POLICY IF EXISTS "buyers can view own orders" ON orders;
CREATE POLICY "buyers can view own orders" ON orders
  FOR SELECT USING (buyer_id = auth.uid());
DROP POLICY IF EXISTS "farmers can view orders for their products" ON orders;
CREATE POLICY "farmers can view orders for their products" ON orders
  FOR SELECT USING (farmer_id = auth.uid());
DROP POLICY IF EXISTS "buyers can create orders" ON orders;
CREATE POLICY "buyers can create orders" ON orders
  FOR INSERT WITH CHECK (buyer_id = auth.uid());
DROP POLICY IF EXISTS "farmers can update order status" ON orders;
CREATE POLICY "farmers can update order status" ON orders
  FOR UPDATE USING (farmer_id = auth.uid());
DROP POLICY IF EXISTS "buyers can cancel own pending orders" ON orders;
CREATE POLICY "buyers can cancel own pending orders" ON orders
  FOR UPDATE USING (buyer_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "order items follow order access" ON order_items;
CREATE POLICY "order items follow order access" ON order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.buyer_id = auth.uid() OR orders.farmer_id = auth.uid()))
  );

DROP POLICY IF EXISTS "reviews are publicly readable" ON reviews;
CREATE POLICY "reviews are publicly readable" ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "buyers can create reviews" ON reviews;
CREATE POLICY "buyers can create reviews" ON reviews FOR INSERT WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS "users can view own notifications" ON notifications;
CREATE POLICY "users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "users can update own notifications" ON notifications;
CREATE POLICY "users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "farmers can view own analytics" ON analytics;
CREATE POLICY "farmers can view own analytics" ON analytics
  FOR SELECT USING (farmer_id = auth.uid());

DROP POLICY IF EXISTS "users can manage own reports" ON reports;
CREATE POLICY "users can manage own reports" ON reports
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "otps for registration and password reset" ON otps;
CREATE POLICY "otps for registration and password reset" ON otps
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "users can verify their own otps" ON otps;
CREATE POLICY "users can verify their own otps" ON otps
  FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email');
DROP POLICY IF EXISTS "users can mark otp used" ON otps;
CREATE POLICY "users can mark otp used" ON otps
  FOR UPDATE USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- ==============================
-- CROP CALENDAR EVENTS (follow farm ownership)
-- ==============================

DROP POLICY IF EXISTS "farmers can manage own calendar events" ON crop_calendar_events;
CREATE POLICY "farmers can manage own calendar events" ON crop_calendar_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM farms WHERE farms.id = crop_calendar_events.farm_id AND farms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "farmers can view own calendar events" ON crop_calendar_events;
CREATE POLICY "farmers can view own calendar events" ON crop_calendar_events
  FOR SELECT USING (user_id = auth.uid());

-- ==============================
-- FARM EXPENSES (follow farm ownership)
-- ==============================

DROP POLICY IF EXISTS "farmers can manage own expenses" ON farm_expenses;
CREATE POLICY "farmers can manage own expenses" ON farm_expenses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM farms WHERE farms.id = farm_expenses.farm_id AND farms.user_id = auth.uid())
  );

-- ==============================
-- WEATHER ALERTS (follow farm ownership)
-- ==============================

DROP POLICY IF EXISTS "farmers can view own weather alerts" ON weather_alerts;
CREATE POLICY "farmers can view own weather alerts" ON weather_alerts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM farms WHERE farms.id = weather_alerts.farm_id AND farms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "farmers can update own weather alerts" ON weather_alerts;
CREATE POLICY "farmers can update own weather alerts" ON weather_alerts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM farms WHERE farms.id = weather_alerts.farm_id AND farms.user_id = auth.uid())
  );

-- ==============================
-- ADMIN OVERRIDE (service_role already bypasses RLS)
-- ==============================
-- Admins can read all data using their service_role key (bypasses RLS automatically)
-- No additional policies needed.
