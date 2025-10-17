-- Event Management Application Database Schema
-- Run this in your Supabase SQL Editor to set up all necessary tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better data integrity
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'refunded');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role user_role DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Mumbai',
  state TEXT NOT NULL DEFAULT 'Maharashtra',
  country TEXT NOT NULL DEFAULT 'India',
  venue TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  capacity INTEGER NOT NULL DEFAULT 100,
  available_tickets INTEGER,
  category TEXT DEFAULT 'General',
  tags TEXT[],
  status event_status DEFAULT 'draft',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  featured BOOLEAN DEFAULT FALSE,
  early_bird_price DECIMAL(10,2),
  early_bird_deadline TIMESTAMP WITH TIME ZONE
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status booking_status DEFAULT 'pending',
  booking_reference TEXT UNIQUE NOT NULL,
  payment_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  attendee_details JSONB DEFAULT '[]',
  special_requirements TEXT,
  discount_applied DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cart_items table for shopping cart functionality
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_per_ticket DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Create user_sessions table for session tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  login_method TEXT DEFAULT 'email',
  location TEXT
);

-- Create admin_analytics table for tracking statistics
CREATE TABLE IF NOT EXISTS public.admin_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL,
  metric_value BIGINT NOT NULL,
  metric_date DATE DEFAULT CURRENT_DATE,
  additional_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_categories table
CREATE TABLE IF NOT EXISTS public.event_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table for event feedback
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON public.events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON public.bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER update_cart_items_updated_at 
    BEFORE UPDATE ON public.cart_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.booking_reference = 'BKG-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 8));
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply booking reference trigger
DROP TRIGGER IF EXISTS generate_booking_ref ON public.bookings;
CREATE TRIGGER generate_booking_ref 
    BEFORE INSERT ON public.bookings 
    FOR EACH ROW EXECUTE FUNCTION generate_booking_reference();

-- Function to update available tickets
CREATE OR REPLACE FUNCTION update_available_tickets()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.events 
        SET available_tickets = COALESCE(available_tickets, capacity) - NEW.quantity
        WHERE id = NEW.event_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.events 
        SET available_tickets = COALESCE(available_tickets, capacity) - NEW.quantity + OLD.quantity
        WHERE id = NEW.event_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.events 
        SET available_tickets = COALESCE(available_tickets, 0) + OLD.quantity
        WHERE id = OLD.event_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply ticket update trigger only for confirmed bookings
DROP TRIGGER IF EXISTS update_tickets_on_booking ON public.bookings;
CREATE TRIGGER update_tickets_on_booking
    AFTER INSERT OR UPDATE OF status OR DELETE ON public.bookings
    FOR EACH ROW 
    WHEN (
        (TG_OP = 'INSERT' AND NEW.status = 'confirmed') OR
        (TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'confirmed') OR
        (TG_OP = 'DELETE' AND OLD.status = 'confirmed')
    )
    EXECUTE FUNCTION update_available_tickets();

-- Initialize available_tickets for existing events
UPDATE public.events SET available_tickets = capacity WHERE available_tickets IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_city ON public.events(city);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON public.bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_event_id ON public.reviews(event_id);

-- Insert default event categories
INSERT INTO public.event_categories (name, description, icon, color) VALUES
('Concerts', 'Music concerts and live performances', 'Music', '#FF6B6B'),
('Conferences', 'Professional conferences and seminars', 'Users', '#4ECDC4'),
('Workshops', 'Educational workshops and training', 'BookOpen', '#45B7D1'),
('Sports', 'Sports events and competitions', 'Trophy', '#96CEB4'),
('Cultural', 'Cultural events and festivals', 'Star', '#FFEAA7'),
('Technology', 'Tech meetups and hackathons', 'Laptop', '#6C5CE7'),
('Food & Drink', 'Food festivals and tastings', 'Coffee', '#FD79A8'),
('Art & Theater', 'Art exhibitions and theater shows', 'Palette', '#FDCB6E')
ON CONFLICT (name) DO NOTHING;

-- Insert sample events for Indian market
INSERT INTO public.events (
    title, description, short_description, image_url, date, end_date, 
    location, city, state, venue, price, capacity, available_tickets, 
    category, status, featured
) VALUES 
(
    'Mumbai Music Festival 2025',
    'Join us for the biggest music festival in Mumbai featuring top Indian and international artists. Experience 3 days of non-stop music across multiple genres including Bollywood, classical, and contemporary.',
    'Mumbai''s biggest music festival with top artists',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80',
    '2025-03-15 18:00:00+05:30',
    '2025-03-17 23:00:00+05:30',
    'MMRDA Grounds, Bandra Kurla Complex',
    'Mumbai',
    'Maharashtra',
    'MMRDA Grounds',
    1500.00,
    5000,
    5000,
    'Concerts',
    'published',
    true
),
(
    'Delhi Tech Conference 2025',
    'India''s premier technology conference bringing together industry leaders, startups, and developers. Learn about the latest trends in AI, blockchain, and digital transformation.',
    'Premier tech conference in Delhi',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    '2025-04-10 09:00:00+05:30',
    '2025-04-12 18:00:00+05:30',
    'India Expo Centre & Mart, Greater Noida',
    'New Delhi',
    'Delhi',
    'India Expo Centre',
    3000.00,
    2000,
    2000,
    'Technology',
    'published',
    true
),
(
    'Bangalore Food Festival',
    'Celebrate the diverse culinary heritage of India with over 100 food stalls, cooking workshops, and celebrity chef demonstrations.',
    'Culinary celebration in Bangalore',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    '2025-02-28 11:00:00+05:30',
    '2025-03-02 22:00:00+05:30',
    'Palace Grounds, Bangalore',
    'Bangalore',
    'Karnataka',
    'Palace Grounds',
    500.00,
    3000,
    3000,
    'Food & Drink',
    'published',
    false
),
(
    'Kolkata Cultural Festival',
    'Immerse yourself in Bengal''s rich cultural heritage with traditional dance, music, art exhibitions, and literary sessions.',
    'Bengal''s cultural heritage celebration',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80',
    '2025-05-20 16:00:00+05:30',
    '2025-05-22 21:00:00+05:30',
    'Maidan, Kolkata',
    'Kolkata',
    'West Bengal',
    'Maidan Grounds',
    800.00,
    4000,
    4000,
    'Cultural',
    'published',
    true
)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users can view their own profile and admins can view all
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    ));

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Events are publicly readable
CREATE POLICY "Events are publicly readable" ON public.events
    FOR SELECT USING (status = 'published' OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    ));

-- Only admins can create/update/delete events
CREATE POLICY "Admins can manage events" ON public.events
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    ));

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    ));

-- Users can create their own bookings
CREATE POLICY "Users can create own bookings" ON public.bookings
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can view and manage their own cart
CREATE POLICY "Users can manage own cart" ON public.cart_items
    FOR ALL USING (user_id = auth.uid());

-- Users can view their own sessions, admins can view all
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    ));

-- Only admins can view analytics
CREATE POLICY "Admins can view analytics" ON public.admin_analytics
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    ));

-- Users can view and create reviews for events they've attended
CREATE POLICY "Users can manage own reviews" ON public.reviews
    FOR ALL USING (user_id = auth.uid());

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

-- Create admin user function
CREATE OR REPLACE FUNCTION public.create_admin_user(
    user_email TEXT,
    user_password TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- This function should be called after creating a user in auth.users
    -- It sets their role to admin in the public.users table
    
    SELECT id INTO new_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF new_user_id IS NOT NULL THEN
        INSERT INTO public.users (id, first_name, last_name, email, role)
        VALUES (new_user_id, 'Admin', 'User', user_email, 'admin')
        ON CONFLICT (id) DO UPDATE SET role = 'admin';
        
        RETURN new_user_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.event_categories TO anon;

GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.events TO authenticated;
GRANT ALL ON public.bookings TO authenticated;
GRANT ALL ON public.cart_items TO authenticated;
GRANT ALL ON public.user_sessions TO authenticated;
GRANT ALL ON public.admin_analytics TO authenticated;
GRANT ALL ON public.reviews TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT SELECT ON public.event_categories TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, first_name, last_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TABLE public.users IS 'User profiles and extended information';
COMMENT ON TABLE public.events IS 'Event listings with Indian market localization';
COMMENT ON TABLE public.bookings IS 'Event bookings and ticket purchases';
COMMENT ON TABLE public.cart_items IS 'Shopping cart functionality';
COMMENT ON TABLE public.user_sessions IS 'User session tracking and analytics';
COMMENT ON TABLE public.admin_analytics IS 'Admin dashboard metrics and statistics';
COMMENT ON TABLE public.reviews IS 'Event reviews and ratings';
COMMENT ON TABLE public.notifications IS 'User notifications system';