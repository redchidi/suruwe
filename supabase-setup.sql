-- Suruwe Database Schema
-- Run this in Supabase SQL Editor

-- Profiles table
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  gender TEXT DEFAULT 'male' CHECK (gender IN ('male', 'female')),
  measurements JSONB DEFAULT '{}',
  measurement_unit TEXT DEFAULT 'inches' CHECK (measurement_unit IN ('inches', 'cm')),
  measurements_updated_at TIMESTAMPTZ,
  style_notes TEXT DEFAULT '',
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tailor_name TEXT NOT NULL,
  tailor_city TEXT DEFAULT '',
  description TEXT NOT NULL,
  fit_notes TEXT DEFAULT '',
  status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'in_progress', 'completed')),
  completed_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order attachments (inspiration images, chat screenshots)
CREATE TABLE order_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  type TEXT DEFAULT 'inspiration' CHECK (type IN ('inspiration', 'screenshot', 'completed')),
  visible_to_tailor BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profile photos
CREATE TABLE profile_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_photos ENABLE ROW LEVEL SECURITY;

-- Public read access for tailor view (profiles accessed by slug)
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Public photos are viewable by everyone"
  ON profile_photos FOR SELECT USING (true);

CREATE POLICY "Public orders are viewable by everyone"
  ON orders FOR SELECT USING (true);

CREATE POLICY "Public attachments are viewable by everyone"
  ON order_attachments FOR SELECT USING (true);

-- Allow inserts and updates from anon (owner identified by localStorage profile ID)
CREATE POLICY "Anyone can create a profile"
  ON profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update profiles"
  ON profiles FOR UPDATE USING (true);

CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update orders"
  ON orders FOR UPDATE USING (true);

CREATE POLICY "Anyone can create attachments"
  ON order_attachments FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete attachments"
  ON order_attachments FOR DELETE USING (true);

CREATE POLICY "Anyone can create photos"
  ON profile_photos FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update photos"
  ON profile_photos FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete photos"
  ON profile_photos FOR DELETE USING (true);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX idx_profiles_slug ON profiles(slug);
CREATE INDEX idx_orders_profile_id ON orders(profile_id);
CREATE INDEX idx_order_attachments_order_id ON order_attachments(order_id);
CREATE INDEX idx_profile_photos_profile_id ON profile_photos(profile_id);
