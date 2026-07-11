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

-- ==============================
-- PUBLIC READ-ONLY POLICIES
-- ==============================

-- Anyone (including anon) can read crops reference
CREATE POLICY "crops are publicly readable" ON crops FOR SELECT USING (true);

-- Anyone can read available marketplace products
CREATE POLICY "available products are publicly readable" ON marketplace_products
  FOR SELECT USING (status = 'available');

-- Anyone can read product images
CREATE POLICY "product images are publicly readable" ON product_images FOR SELECT USING (true);

-- ==============================
-- AUTHENTICATED USER POLICIES
-- ==============================

-- Users can read/update their own record
CREATE POLICY "users can read own record" ON users
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "users can update own record" ON users
  FOR UPDATE USING (id = auth.uid());

-- Users can manage their own refresh tokens
CREATE POLICY "users can manage own refresh tokens" ON refresh_tokens
  FOR ALL USING (user_id = auth.uid());

-- Farmers manage their own farms
CREATE POLICY "farmers can manage own farms" ON farms
  FOR ALL USING (user_id = auth.uid());

-- Farm images follow farm ownership
CREATE POLICY "farm images follow farm access" ON farm_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM farms WHERE farms.id = farm_images.farm_id AND farms.user_id = auth.uid())
  );

-- Farmers manage their own crops
CREATE POLICY "farmers can manage own crops" ON user_crops
  FOR ALL USING (
    EXISTS (SELECT 1 FROM farms WHERE farms.id = user_crops.farm_id AND farms.user_id = auth.uid())
  );

-- Crop recommendations follow farm ownership
CREATE POLICY "farmers can view own recommendations" ON crop_recommendations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM farms WHERE farms.id = crop_recommendations.farm_id AND farms.user_id = auth.uid())
  );

-- Weather history follows farm ownership
CREATE POLICY "farmers can view own weather" ON weather_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM farms WHERE farms.id = weather_history.farm_id AND farms.user_id = auth.uid())
  );

-- Harvest predictions follow farm ownership
CREATE POLICY "farmers can view own harvest predictions" ON harvest_predictions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM farms WHERE farms.id = harvest_predictions.farm_id AND farms.user_id = auth.uid())
  );

-- Farmers manage their own products, buyers can read all available
CREATE POLICY "farmers can manage own products" ON marketplace_products
  FOR INSERT WITH CHECK (farmer_id = auth.uid());
CREATE POLICY "farmers can update own products" ON marketplace_products
  FOR UPDATE USING (farmer_id = auth.uid());
CREATE POLICY "farmers can delete own products" ON marketplace_products
  FOR DELETE USING (farmer_id = auth.uid());

-- Product images follow product ownership
CREATE POLICY "product images follow product ownership" ON product_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM marketplace_products WHERE marketplace_products.id = product_images.product_id AND marketplace_products.farmer_id = auth.uid())
  );

-- Order visibility: buyers see their orders, farmers see orders for their products
CREATE POLICY "buyers can view own orders" ON orders
  FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "farmers can view orders for their products" ON orders
  FOR SELECT USING (farmer_id = auth.uid());
CREATE POLICY "buyers can create orders" ON orders
  FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "farmers can update order status" ON orders
  FOR UPDATE USING (farmer_id = auth.uid());
CREATE POLICY "buyers can cancel own pending orders" ON orders
  FOR UPDATE USING (buyer_id = auth.uid() AND status = 'pending');

-- Order items follow order visibility
CREATE POLICY "order items follow order access" ON order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.buyer_id = auth.uid() OR orders.farmer_id = auth.uid()))
  );

-- Reviews: buyers create, anyone reads
CREATE POLICY "reviews are publicly readable" ON reviews FOR SELECT USING (true);
CREATE POLICY "buyers can create reviews" ON reviews FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Notifications only visible to the recipient
CREATE POLICY "users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Analytics follow farmer ownership
CREATE POLICY "farmers can view own analytics" ON analytics
  FOR SELECT USING (farmer_id = auth.uid());

-- Reports follow user ownership
CREATE POLICY "users can manage own reports" ON reports
  FOR ALL USING (user_id = auth.uid());

-- OTPs: insert for forgot/register, select/update for verify
CREATE POLICY "otps for registration and password reset" ON otps
  FOR INSERT WITH TRUE;
CREATE POLICY "users can verify their own otps" ON otps
  FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email');
CREATE POLICY "users can mark otp used" ON otps
  FOR UPDATE USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- ==============================
-- ADMIN OVERRIDE (service_role already bypasses RLS)
-- ==============================
-- Admins can read all data using their service_role key (bypasses RLS automatically)
-- No additional policies needed.
