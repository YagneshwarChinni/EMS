import { createClient } from '@supabase/supabase-js@2.39.0';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Database types for TypeScript support
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  login_count: number;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  short_description?: string;
  image_url?: string;
  date: string;
  end_date?: string;
  location: string;
  city: string;
  state: string;
  country: string;
  venue?: string;
  price: number;
  currency: string;
  capacity: number;
  available_tickets?: number;
  category: string;
  tags?: string[];
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  created_by?: string;
  created_at: string;
  updated_at: string;
  featured: boolean;
  early_bird_price?: number;
  early_bird_deadline?: string;
}

export interface Booking {
  id: string;
  user_id: string;
  event_id: string;
  quantity: number;
  total_amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  booking_reference: string;
  payment_id?: string;
  payment_status: string;
  attendee_details?: any[];
  special_requirements?: string;
  discount_applied: number;
  created_at: string;
  updated_at: string;
  event?: Event;
}

export interface CartItem {
  id: string;
  user_id: string;
  event_id: string;
  quantity: number;
  price_per_ticket: number;
  created_at: string;
  updated_at: string;
  event?: Event;
}

export interface Review {
  id: string;
  user_id: string;
  event_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  user?: Pick<User, 'first_name' | 'last_name' | 'avatar_url'>;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  action_url?: string;
  created_at: string;
}

export interface EventCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  created_at: string;
}

// Auth helper functions
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return profile;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  // Update login tracking
  if (data.user) {
    await supabase
      .from('users')
      .update({ 
        last_login: new Date().toISOString(),
        login_count: supabase.sql`login_count + 1`
      })
      .eq('id', data.user.id);
      
    // Track session
    await supabase
      .from('user_sessions')
      .insert({
        user_id: data.user.id,
        login_method: 'email',
        ip_address: null, // Will be set by server
        user_agent: navigator.userAgent,
      });
  }
  
  return data;
};

export const signUpWithEmail = async (
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });
  
  if (error) throw error;
  return data;
};

export const signInWithProvider = async (provider: 'google' | 'facebook' | 'github') => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin,
    },
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};