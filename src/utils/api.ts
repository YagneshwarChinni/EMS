import { supabase, signInWithEmail, signUpWithEmail, signInWithProvider, getCurrentUser } from './supabase/client';
import type { Event, Booking, CartItem, User } from './supabase/client';
import { mockServer } from './mockServer';

const USE_SUPABASE = true; // Use real Supabase database

class ApiClient {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    // Use Supabase database for real data
    if (USE_SUPABASE) {
      return this.handleSupabaseRequest(endpoint, options);
    }

    // Fallback to mock server for development
    return this.handleMockRequest(endpoint, options);
  }

  private async handleSupabaseRequest(endpoint: string, options: RequestInit = {}) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body as string) : {};
    const authHeader = (options.headers as any)?.['Authorization'];
    const token = authHeader?.replace('Bearer ', '');

    try {
      // Authentication endpoints
      if (endpoint === '/signup' && method === 'POST') {
        const result = await signUpWithEmail(
          body.email,
          body.password,
          body.firstName,
          body.lastName
        );
        return { 
          success: true, 
          user: result.user,
          message: 'Account created successfully! Please check your email for verification.'
        };
      }

      if (endpoint === '/signin' && method === 'POST') {
        const result = await signInWithEmail(body.email, body.password);
        return { 
          success: true, 
          user: result.user,
          token: result.session?.access_token,
          message: 'Signed in successfully!'
        };
      }

      if (endpoint === '/auth/social' && method === 'POST') {
        const result = await signInWithProvider(body.provider);
        return { 
          success: true, 
          message: 'Redirecting to social login...'
        };
      }

      // Events endpoints
      if (endpoint === '/events' && method === 'GET') {
        const { data: events, error } = await supabase
          .from('events')
          .select('*')
          .eq('status', 'published')
          .order('date', { ascending: true });

        if (error) throw error;
        return { success: true, data: events };
      }

      if (endpoint.startsWith('/events/') && method === 'GET') {
        const eventId = endpoint.split('/events/')[1];
        const { data: event, error } = await supabase
          .from('events')
          .select(`
            *,
            reviews (
              id,
              rating,
              comment,
              created_at,
              user:users(first_name, last_name, avatar_url)
            )
          `)
          .eq('id', eventId)
          .single();

        if (error) throw error;
        return { success: true, data: event };
      }

      // Booking endpoints
      if (endpoint === '/bookings' && method === 'POST') {
        if (!token) throw new Error('Authentication required');

        const user = await getCurrentUser();
        if (!user) throw new Error('User not found');

        const { data: booking, error } = await supabase
          .from('bookings')
          .insert({
            user_id: user.id,
            event_id: body.eventId,
            quantity: body.quantity,
            total_amount: body.totalAmount,
            status: 'confirmed'
          })
          .select('*')
          .single();

        if (error) throw error;
        return { success: true, data: booking };
      }

      if (endpoint === '/user/bookings' && method === 'GET') {
        if (!token) throw new Error('Authentication required');

        const user = await getCurrentUser();
        if (!user) throw new Error('User not found');

        const { data: bookings, error } = await supabase
          .from('bookings')
          .select(`
            *,
            event:events(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: bookings };
      }

      // Cart endpoints
      if (endpoint === '/cart' && method === 'GET') {
        if (!token) throw new Error('Authentication required');

        const user = await getCurrentUser();
        if (!user) throw new Error('User not found');

        const { data: cartItems, error } = await supabase
          .from('cart_items')
          .select(`
            *,
            event:events(*)
          `)
          .eq('user_id', user.id);

        if (error) throw error;
        return { success: true, data: cartItems };
      }

      if (endpoint === '/cart' && method === 'POST') {
        if (!token) throw new Error('Authentication required');

        const user = await getCurrentUser();
        if (!user) throw new Error('User not found');

        const { data: cartItem, error } = await supabase
          .from('cart_items')
          .upsert({
            user_id: user.id,
            event_id: body.eventId,
            quantity: body.quantity,
            price_per_ticket: body.pricePerTicket
          })
          .select('*')
          .single();

        if (error) throw error;
        return { success: true, data: cartItem };
      }

      if (endpoint.startsWith('/cart/') && method === 'DELETE') {
        if (!token) throw new Error('Authentication required');

        const cartItemId = endpoint.split('/cart/')[1];
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', cartItemId);

        if (error) throw error;
        return { success: true, message: 'Item removed from cart' };
      }

      // Admin endpoints
      if (endpoint === '/admin/stats' && method === 'GET') {
        if (!token) throw new Error('Authentication required');

        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
          throw new Error('Admin access required');
        }

        // Get various statistics
        const [eventsResult, bookingsResult, usersResult, revenueResult] = await Promise.all([
          supabase.from('events').select('id', { count: 'exact', head: true }),
          supabase.from('bookings').select('id', { count: 'exact', head: true }),
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('bookings').select('total_amount').eq('status', 'confirmed')
        ]);

        const totalRevenue = revenueResult.data?.reduce((sum, booking) => sum + booking.total_amount, 0) || 0;

        return {
          success: true,
          data: {
            totalEvents: eventsResult.count || 0,
            totalBookings: bookingsResult.count || 0,
            totalUsers: usersResult.count || 0,
            totalRevenue
          }
        };
      }

      if (endpoint === '/admin/events' && method === 'GET') {
        if (!token) throw new Error('Authentication required');

        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
          throw new Error('Admin access required');
        }

        const { data: events, error } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: events };
      }

      if (endpoint === '/admin/events' && method === 'POST') {
        if (!token) throw new Error('Authentication required');

        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
          throw new Error('Admin access required');
        }

        const { data: event, error } = await supabase
          .from('events')
          .insert({
            ...body,
            created_by: user.id,
            available_tickets: body.capacity
          })
          .select('*')
          .single();

        if (error) throw error;
        return { success: true, data: event };
      }

      if (endpoint === '/admin/users' && method === 'GET') {
        if (!token) throw new Error('Authentication required');

        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
          throw new Error('Admin access required');
        }

        const { data: users, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: users };
      }

      throw new Error(`Unsupported endpoint: ${method} ${endpoint}`);
    } catch (error) {
      console.error('Supabase request failed:', error);
      
      // Check if it's a table not found error (PGRST205)
      if (error instanceof Error && error.message.includes('PGRST205')) {
        console.warn('Database tables not found. Please run the database schema setup. Falling back to mock data.');
        return this.handleMockRequest(endpoint, options);
      }
      
      // For other Supabase errors, also fall back to mock data
      if (error instanceof Error && (
        error.message.includes('PGRST') || 
        error.message.includes('schema cache') ||
        error.message.includes('Could not find')
      )) {
        console.warn('Database schema issue detected. Falling back to mock data.');
        return this.handleMockRequest(endpoint, options);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Request failed');
    }
  }

  private async handleMockRequest(endpoint: string, options: RequestInit = {}) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body as string) : {};
    const authHeader = (options.headers as any)?.['Authorization'];
    const token = authHeader?.replace('Bearer ', '');

    try {
      // Route to appropriate mock server method
      if (endpoint === '/signup' && method === 'POST') {
        return await mockServer.signUp(body.email, body.password, body.firstName, body.lastName);
      }

      if (endpoint === '/signin' && method === 'POST') {
        return await mockServer.signIn(body.email, body.password);
      }

      if (endpoint === '/auth/social' && method === 'POST') {
        return await mockServer.signInWithSocial(body.provider);
      }

      if (endpoint === '/events' && method === 'GET') {
        return await mockServer.getEvents();
      }

      if (endpoint.startsWith('/events/') && method === 'GET') {
        const eventId = endpoint.split('/events/')[1];
        return await mockServer.getEvent(eventId);
      }

      if (endpoint === '/bookings' && method === 'POST') {
        return await mockServer.createBooking(token!, body.eventId, body.quantity, body.totalAmount);
      }

      if (endpoint === '/user/bookings' && method === 'GET') {
        return await mockServer.getUserBookings(token!);
      }

      if (endpoint === '/admin/stats' && method === 'GET') {
        return await mockServer.getAdminStats(token!);
      }

      if (endpoint === '/admin/events' && method === 'GET') {
        return await mockServer.getAdminEvents(token!);
      }

      if (endpoint === '/admin/events' && method === 'POST') {
        return await mockServer.createAdminEvent(token!, body);
      }

      if (endpoint === '/admin/users' && method === 'GET') {
        return await mockServer.getAdminUsers(token!);
      }

      throw new Error(`Unsupported endpoint: ${method} ${endpoint}`);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Request failed');
    }
  }

  async signUp(email: string, password: string, firstName: string, lastName: string) {
    return this.makeRequest('/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
  }

  async signIn(email: string, password: string) {
    return this.makeRequest('/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signInWithSocial(provider: 'google' | 'facebook' | 'github') {
    return this.makeRequest('/auth/social', {
      method: 'POST',
      body: JSON.stringify({ provider }),
    });
  }

  async getCartItems(token: string) {
    return this.makeRequest('/cart', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  }

  async addToCart(token: string, eventId: string, quantity: number, pricePerTicket: number) {
    return this.makeRequest('/cart', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ eventId, quantity, pricePerTicket }),
    });
  }

  async removeFromCart(token: string, cartItemId: string) {
    return this.makeRequest(`/cart/${cartItemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  }

  async getEvents() {
    return this.makeRequest('/events');
  }

  async getEvent(eventId: string) {
    return this.makeRequest(`/events/${eventId}`);
  }

  async createBooking(token: string, eventId: string, quantity: number, totalAmount?: number) {
    return this.makeRequest('/bookings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ eventId, quantity, totalAmount }),
    });
  }

  async getUserBookings(token: string) {
    return this.makeRequest('/user/bookings', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  }

  async getAdminStats(token: string) {
    return this.makeRequest('/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  }

  async getAdminEvents(token: string) {
    return this.makeRequest('/admin/events', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  }

  async createAdminEvent(token: string, eventData: any) {
    return this.makeRequest('/admin/events', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(eventData),
    });
  }

  async getAdminUsers(token: string) {
    return this.makeRequest('/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  }
}

export const apiClient = new ApiClient();