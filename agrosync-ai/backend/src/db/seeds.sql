-- Seed data for AgroSync AI
-- Run after schema.sql in Supabase SQL Editor

-- Crops reference data
INSERT INTO crops (crop_name, season, soil_type, ideal_temperature, growth_duration, water_requirement) VALUES
('Rice', 'Kharif', 'Clay', 25, 120, 'High'),
('Wheat', 'Rabi', 'Loamy', 22, 110, 'Moderate'),
('Maize', 'Kharif', 'Loamy', 27, 100, 'Moderate'),
('Cotton', 'Kharif', 'Black', 28, 165, 'Moderate'),
('Sugarcane', 'Kharif', 'Loamy', 30, 365, 'High'),
('Pulses', 'Rabi', 'Sandy', 24, 80, 'Low'),
('Groundnut', 'Kharif', 'Sandy', 26, 120, 'Moderate'),
('Millet', 'Kharif', 'Red', 28, 75, 'Low'),
('Barley', 'Rabi', 'Loamy', 20, 90, 'Low'),
('Sunflower', 'Rabi', 'Black', 25, 100, 'Moderate'),
('Potato', 'Rabi', 'Loamy', 18, 90, 'Moderate'),
('Tomato', 'Kharif', 'Loamy', 25, 75, 'Moderate'),
('Onion', 'Rabi', 'Sandy', 22, 120, 'Moderate'),
('Chili', 'Kharif', 'Loamy', 28, 100, 'Moderate'),
('Banana', 'Kharif', 'Loamy', 30, 365, 'High');

-- Create default admin user (password: admin123)
-- Run only if needed - the OTP flow handles registration
-- INSERT INTO users (name, email, password_hash, role, status) VALUES ('Admin', 'admin@agrosync.ai', '$2a$10$placeholder_hash', 'admin', 'active');
