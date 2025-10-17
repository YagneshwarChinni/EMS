import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper function to generate JWT-like token (simplified)
function generateToken(userId: string): string {
  return btoa(JSON.stringify({ userId, exp: Date.now() + 24 * 60 * 60 * 1000 }));
}

// Helper function to verify token
function verifyToken(token: string): { userId: string } | null {
  try {
    console.log('Verifying token...');
    const decoded = JSON.parse(atob(token));
    console.log('Token decoded successfully, checking expiry...');
    
    if (!decoded.userId) {
      console.log('No userId in token');
      return null;
    }
    
    if (decoded.exp < Date.now()) {
      console.log('Token expired');
      return null;
    }
    
    console.log('Token verification successful');
    return { userId: decoded.userId };
  } catch (error) {
    console.log('Token verification error:', error);
    return null;
  }
}

// Authentication middleware
async function requireAuth(c: any, next: any) {
  try {
    const authHeader = c.req.header('Authorization');
    console.log('Auth header received:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.log('No Authorization header found');
      return c.json({ error: 'Authorization header required' }, 401);
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.log('Invalid Authorization header format');
      return c.json({ error: 'Invalid Authorization header format' }, 401);
    }
    
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    if (!token) {
      console.log('No token provided after Bearer prefix');
      return c.json({ error: 'Authorization token required' }, 401);
    }
    
    console.log('Token extracted, length:', token.length);
    
    const payload = verifyToken(token);
    console.log('Token verification result:', payload ? 'Valid' : 'Invalid');
    
    if (!payload) {
      console.log('Token verification failed');
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
    
    console.log('Auth successful, userId:', payload.userId);
    c.set('userId', payload.userId);
    await next();
  } catch (error) {
    console.log('Auth middleware error:', error);
    return c.json({ error: `Authentication failed: ${error.message}` }, 401);
  }
}

// Admin middleware
async function requireAdmin(c: any, next: any) {
  try {
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    const user = await kv.get(`user:${userId}`);
    if (!user || !user.isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    await next();
  } catch (error) {
    console.log('Admin middleware error:', error);
    return c.json({ error: 'Admin access verification failed' }, 500);
  }
}

// Initialize sample events and test user data
async function initializeData() {
  // Initialize test user if no users exist
  const existingUsers = await kv.getByPrefix('user_email:');
  if (existingUsers.length === 0) {
    console.log('No users found, creating test user and admin...');
    
    // Create regular test user
    const testUserId = crypto.randomUUID();
    const testPassword = await hashPassword('password123');
    
    const testUser = {
      id: testUserId,
      email: 'test@example.com',
      password: testPassword,
      firstName: 'Test',
      lastName: 'User',
      isAdmin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`user:${testUserId}`, testUser);
    await kv.set(`user_email:test@example.com`, testUserId);
    console.log('Test user created: test@example.com / password123');
    
    // Create admin user
    const adminUserId = crypto.randomUUID();
    const adminPassword = await hashPassword('admin123');
    
    const adminUser = {
      id: adminUserId,
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`user:${adminUserId}`, adminUser);
    await kv.set(`user_email:admin@example.com`, adminUserId);
    console.log('Admin user created: admin@example.com / admin123');
  }

  const existingEvents = await kv.getByPrefix('event:');
  if (existingEvents.length === 0) {
    const sampleEvents = [
      {
        id: '1',
        title: 'React Developer Conference 2025',
        description: 'Join us for the biggest React conference of the year! Learn about the latest features, best practices, and connect with fellow developers.',
        dateTime: '2025-03-15T10:00:00Z',
        location: 'San Francisco Convention Center',
        type: 'Conference',
        totalTickets: 500,
        availableTickets: 350,
        price: 299.99,
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: '2',
        title: 'Jazz Night at Blue Note',
        description: 'An intimate evening of smooth jazz featuring renowned musicians from around the world.',
        dateTime: '2025-02-28T20:00:00Z',
        location: 'Blue Note Jazz Club, NYC',
        type: 'Concert',
        totalTickets: 150,
        availableTickets: 75,
        price: 85.00,
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: '3',
        title: 'Digital Marketing Workshop',
        description: 'Master the art of digital marketing with hands-on workshops covering SEO, social media, and content strategy.',
        dateTime: '2025-03-05T09:00:00Z',
        location: 'Downtown Business Center',
        type: 'Workshop',
        totalTickets: 50,
        availableTickets: 25,
        price: 150.00,
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: '4',
        title: 'Championship Basketball Game',
        description: 'Don\'t miss the thrilling championship game between the city\'s top teams!',
        dateTime: '2025-04-12T19:00:00Z',
        location: 'Madison Square Garden',
        type: 'Sports',
        totalTickets: 20000,
        availableTickets: 15000,
        price: 75.00,
        imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: '5',
        title: 'Art Gallery Opening',
        description: 'Discover contemporary art from emerging local artists at our latest gallery opening.',
        dateTime: '2025-03-20T18:00:00Z',
        location: 'Modern Art Gallery',
        type: 'Arts & Culture',
        totalTickets: 200,
        availableTickets: 180,
        price: 25.00,
        imageUrl: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      }
    ];

    for (const event of sampleEvents) {
      await kv.set(`event:${event.id}`, event);
    }
    console.log('Sample events initialized');
  }
}

// Initialize data on startup
initializeData();

// Health check endpoint
app.get('/make-server-1eecec3b/health', async (c) => {
  try {
    const users = await kv.getByPrefix('user_email:');
    const events = await kv.getByPrefix('event:');
    const bookings = await kv.getByPrefix('booking:');
    
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      data: {
        userCount: users.length,
        eventCount: events.length,
        bookingCount: bookings.length,
        users: users.slice(0, 5) // Show first 5 users for debugging
      }
    });
  } catch (error) {
    console.log('Health check error:', error);
    return c.json({ status: 'error', error: error.message }, 500);
  }
});

// Test auth endpoint
app.get('/make-server-1eecec3b/test-auth', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    console.log('Test auth - userId from context:', userId);
    
    const user = await kv.get(`user:${userId}`);
    console.log('Test auth - user found:', user ? 'Yes' : 'No');
    
    return c.json({
      message: 'Auth test successful',
      userId,
      timestamp: new Date().toISOString(),
      user: user ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      } : null
    });
  } catch (error) {
    console.log('Test auth error:', error);
    return c.json({ error: `Test auth failed: ${error.message}` }, 500);
  }
});

// Test KV store endpoint
app.get('/make-server-1eecec3b/test-kv', async (c) => {
  try {
    // Test basic KV operations
    const testKey = 'test_key_' + Date.now();
    const testValue = { message: 'Hello KV!', timestamp: new Date().toISOString() };
    
    console.log('Testing KV set...');
    await kv.set(testKey, testValue);
    
    console.log('Testing KV get...');
    const retrieved = await kv.get(testKey);
    
    console.log('Testing KV delete...');
    await kv.del(testKey);
    
    return c.json({
      message: 'KV test successful',
      testValue,
      retrieved,
      match: JSON.stringify(testValue) === JSON.stringify(retrieved)
    });
  } catch (error) {
    console.log('KV test error:', error);
    return c.json({ error: 'KV test failed', details: error.message }, 500);
  }
});

// Auth endpoints
app.post('/make-server-1eecec3b/signup', async (c) => {
  try {
    const { email, password, firstName, lastName } = await c.req.json();
    
    console.log('Signup attempt for email:', email);
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Check if user already exists
    const existingUser = await kv.get(`user_email:${email}`);
    if (existingUser) {
      console.log('User already exists:', email);
      return c.json({ error: 'User already exists with this email' }, 400);
    }

    const userId = crypto.randomUUID();
    const hashedPassword = await hashPassword(password);
    
    console.log('Creating user with ID:', userId);
    console.log('Password hashed to:', hashedPassword.substring(0, 10) + '...');
    
    const user = {
      id: userId,
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      isAdmin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`user:${userId}`, user);
    await kv.set(`user_email:${email}`, userId);
    
    console.log('User created successfully:', email);

    const token = generateToken(userId);
    
    return c.json({ 
      user: { 
        id: userId, 
        email, 
        firstName: firstName || '', 
        lastName: lastName || '',
        isAdmin: false
      }, 
      token 
    });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

app.post('/make-server-1eecec3b/signin', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    console.log('Signin attempt for email:', email);
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const userId = await kv.get(`user_email:${email}`);
    console.log('Found userId for email:', userId);
    
    if (!userId) {
      console.log('No user found for email:', email);
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const user = await kv.get(`user:${userId}`);
    console.log('Found user:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('User data not found for userId:', userId);
      return c.json({ error: 'User not found' }, 401);
    }

    const hashedPassword = await hashPassword(password);
    console.log('Password hash comparison:', {
      stored: user.password ? user.password.substring(0, 10) + '...' : 'None',
      computed: hashedPassword.substring(0, 10) + '...'
    });
    
    if (user.password !== hashedPassword) {
      console.log('Password mismatch for user:', email);
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const token = generateToken(userId);
    console.log('Signin successful for user:', email);
    
    return c.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName,
        isAdmin: user.isAdmin || false
      }, 
      token 
    });
  } catch (error) {
    console.log('Signin error:', error);
    return c.json({ error: 'Failed to sign in' }, 500);
  }
});

app.get('/make-server-1eecec3b/user/profile', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const user = await kv.get(`user:${userId}`);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName 
      } 
    });
  } catch (error) {
    console.log('Profile fetch error:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

app.put('/make-server-1eecec3b/user/profile', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { firstName, lastName } = await c.req.json();
    
    const user = await kv.get(`user:${userId}`);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const updatedUser = {
      ...user,
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`user:${userId}`, updatedUser);
    
    return c.json({ 
      user: { 
        id: updatedUser.id, 
        email: updatedUser.email, 
        firstName: updatedUser.firstName, 
        lastName: updatedUser.lastName 
      } 
    });
  } catch (error) {
    console.log('Profile update error:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Events endpoints
app.get('/make-server-1eecec3b/events', async (c) => {
  try {
    const { type, search, date } = c.req.query();
    const events = await kv.getByPrefix('event:');
    
    let filteredEvents = events;
    
    if (type) {
      filteredEvents = filteredEvents.filter(event => 
        event.type.toLowerCase() === type.toLowerCase()
      );
    }
    
    if (search) {
      filteredEvents = filteredEvents.filter(event =>
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        event.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (date) {
      filteredEvents = filteredEvents.filter(event =>
        event.dateTime.startsWith(date)
      );
    }
    
    return c.json({ events: filteredEvents });
  } catch (error) {
    console.log('Events fetch error:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

app.get('/make-server-1eecec3b/events/:id', async (c) => {
  try {
    const eventId = c.req.param('id');
    const event = await kv.get(`event:${eventId}`);
    
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    return c.json({ event });
  } catch (error) {
    console.log('Event fetch error:', error);
    return c.json({ error: 'Failed to fetch event' }, 500);
  }
});

// Bookings endpoints
app.post('/make-server-1eecec3b/events/:id/book', requireAuth, async (c) => {
  try {
    const eventId = c.req.param('id');
    const userId = c.get('userId');
    console.log('=== BOOKING CREATION START ===');
    console.log('EventID:', eventId, 'UserID:', userId);
    
    if (!userId) {
      console.log('ERROR: No userId found in context after auth');
      return c.json({ error: 'User authentication failed' }, 401);
    }
    
    if (!eventId) {
      console.log('ERROR: No eventId provided');
      return c.json({ error: 'Event ID is required' }, 400);
    }

    let requestBody;
    try {
      requestBody = await c.req.json();
    } catch (error) {
      console.log('ERROR: Failed to parse request body:', error);
      return c.json({ error: 'Invalid request body' }, 400);
    }

    const { quantity } = requestBody;
    console.log('Booking quantity:', quantity);
    
    if (!quantity || quantity < 1) {
      console.log('ERROR: Invalid quantity:', quantity);
      return c.json({ error: 'Valid quantity is required' }, 400);
    }

    console.log('Fetching event data...');
    const event = await kv.get(`event:${eventId}`);
    console.log('Event found:', event ? 'Yes' : 'No');
    
    if (!event) {
      console.log('ERROR: Event not found for ID:', eventId);
      return c.json({ error: 'Event not found' }, 404);
    }

    console.log('Event details:', {
      title: event.title,
      availableTickets: event.availableTickets,
      price: event.price
    });
    
    if (event.availableTickets < quantity) {
      console.log('ERROR: Not enough tickets. Available:', event.availableTickets, 'Requested:', quantity);
      return c.json({ error: `Not enough tickets available. Only ${event.availableTickets} tickets left.` }, 400);
    }

    const bookingId = crypto.randomUUID();
    const totalPrice = event.price * quantity;
    
    console.log('Generating booking with ID:', bookingId, 'Total price:', totalPrice);
    
    const booking = {
      id: bookingId,
      userId,
      eventId,
      quantity,
      totalPrice,
      bookingDate: new Date().toISOString(),
      status: 'Confirmed'
    };

    // Update event availability
    const updatedEvent = {
      ...event,
      availableTickets: event.availableTickets - quantity
    };

    console.log('Saving booking data to KV store...');
    
    try {
      await kv.set(`booking:${bookingId}`, booking);
      console.log('✓ Booking saved');
      
      await kv.set(`user_booking:${userId}:${bookingId}`, bookingId);
      console.log('✓ User booking reference saved');
      
      await kv.set(`event:${eventId}`, updatedEvent);
      console.log('✓ Event updated with new availability');
      
    } catch (kvError) {
      console.log('ERROR: KV store operation failed:', kvError);
      return c.json({ error: 'Failed to save booking data' }, 500);
    }
    
    console.log('=== BOOKING CREATION SUCCESS ===');
    
    return c.json({ 
      success: true,
      booking: {
        ...booking,
        event: {
          title: event.title,
          dateTime: event.dateTime,
          location: event.location
        }
      }
    });
  } catch (error) {
    console.log('=== BOOKING CREATION ERROR ===');
    console.log('Error details:', error);
    console.log('Error stack:', error.stack);
    return c.json({ 
      error: `Booking creation failed: ${error.message}`,
      details: error.stack 
    }, 500);
  }
});

app.get('/make-server-1eecec3b/user/bookings', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    console.log('Fetching bookings for user:', userId);
    
    const userBookingIds = await kv.getByPrefix(`user_booking:${userId}:`);
    console.log('Found booking IDs:', userBookingIds);
    
    const bookings = [];
    for (const bookingId of userBookingIds) {
      console.log('Processing booking ID:', bookingId);
      const booking = await kv.get(`booking:${bookingId}`);
      console.log('Booking data:', booking ? 'Found' : 'Not found');
      
      if (booking) {
        const event = await kv.get(`event:${booking.eventId}`);
        console.log('Event data for booking:', event ? 'Found' : 'Not found');
        
        bookings.push({
          ...booking,
          event: event ? {
            title: event.title,
            dateTime: event.dateTime,
            location: event.location,
            imageUrl: event.imageUrl
          } : null
        });
      }
    }
    
    console.log('Returning bookings:', bookings.length);
    return c.json({ bookings });
  } catch (error) {
    console.log('User bookings fetch error:', error);
    return c.json({ error: 'Failed to fetch bookings' }, 500);
  }
});

// Alternative booking endpoint for cart functionality
app.post('/make-server-1eecec3b/bookings', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { eventId, quantity, totalAmount } = await c.req.json();
    
    console.log('Creating booking:', { userId, eventId, quantity, totalAmount });
    
    if (!eventId || !quantity || quantity < 1) {
      return c.json({ error: 'Event ID and valid quantity are required' }, 400);
    }

    const event = await kv.get(`event:${eventId}`);
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    if (event.availableTickets < quantity) {
      return c.json({ error: `Not enough tickets available. Only ${event.availableTickets} tickets left.` }, 400);
    }

    const bookingId = crypto.randomUUID();
    const calculatedTotal = event.price * quantity;
    
    const booking = {
      id: bookingId,
      userId,
      eventId,
      quantity,
      totalPrice: totalAmount || calculatedTotal,
      bookingDate: new Date().toISOString(),
      status: 'Confirmed'
    };

    // Update event availability
    const updatedEvent = {
      ...event,
      availableTickets: event.availableTickets - quantity
    };

    await kv.set(`booking:${bookingId}`, booking);
    await kv.set(`user_booking:${userId}:${bookingId}`, bookingId);
    await kv.set(`event:${eventId}`, updatedEvent);
    
    return c.json({ 
      success: true,
      booking: {
        ...booking,
        event: {
          title: event.title,
          dateTime: event.dateTime,
          location: event.location
        }
      }
    });
  } catch (error) {
    console.log('Booking creation error:', error);
    return c.json({ error: 'Failed to create booking' }, 500);
  }
});

// Admin endpoints
app.get('/make-server-1eecec3b/admin/stats', requireAuth, requireAdmin, async (c) => {
  try {
    const events = await kv.getByPrefix('event:');
    const bookings = await kv.getByPrefix('booking:');
    const users = await kv.getByPrefix('user:');
    
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
    const activeEvents = events.filter(event => event.availableTickets > 0).length;
    
    return c.json({
      totalEvents: events.length,
      totalBookings: bookings.length,
      totalRevenue,
      activeEvents,
      totalUsers: users.length
    });
  } catch (error) {
    console.log('Admin stats error:', error);
    return c.json({ error: 'Failed to fetch admin stats' }, 500);
  }
});

app.get('/make-server-1eecec3b/admin/bookings', requireAuth, requireAdmin, async (c) => {
  try {
    const { limit = '50' } = c.req.query();
    const bookings = await kv.getByPrefix('booking:');
    
    const bookingsWithDetails = [];
    for (const booking of bookings.slice(0, parseInt(limit))) {
      const event = await kv.get(`event:${booking.eventId}`);
      const user = await kv.get(`user:${booking.userId}`);
      
      bookingsWithDetails.push({
        ...booking,
        eventTitle: event?.title || 'Unknown Event',
        userEmail: user?.email || 'Unknown User'
      });
    }
    
    // Sort by booking date (newest first)
    bookingsWithDetails.sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
    
    return c.json({ bookings: bookingsWithDetails });
  } catch (error) {
    console.log('Admin bookings error:', error);
    return c.json({ error: 'Failed to fetch admin bookings' }, 500);
  }
});

app.get('/make-server-1eecec3b/admin/events', requireAuth, requireAdmin, async (c) => {
  try {
    const events = await kv.getByPrefix('event:');
    
    const eventsWithBookingCount = [];
    for (const event of events) {
      const bookings = await kv.getByPrefix('booking:');
      const eventBookings = bookings.filter(booking => booking.eventId === event.id);
      const bookingsCount = eventBookings.reduce((sum, booking) => sum + booking.quantity, 0);
      
      eventsWithBookingCount.push({
        ...event,
        bookingsCount,
        status: event.availableTickets > 0 ? 'active' : 'sold-out',
        category: event.type,
        capacity: event.totalTickets,
        createdAt: new Date().toISOString()
      });
    }
    
    return c.json({ events: eventsWithBookingCount });
  } catch (error) {
    console.log('Admin events error:', error);
    return c.json({ error: 'Failed to fetch admin events' }, 500);
  }
});

app.post('/make-server-1eecec3b/admin/events', requireAuth, requireAdmin, async (c) => {
  try {
    const eventData = await c.req.json();
    const { title, description, date, location, price, capacity, category, imageUrl, status } = eventData;
    
    if (!title || !date || !location || price === undefined) {
      return c.json({ error: 'Title, date, location, and price are required' }, 400);
    }
    
    const eventId = crypto.randomUUID();
    const event = {
      id: eventId,
      title,
      description: description || '',
      dateTime: new Date(date).toISOString(),
      location,
      type: category || 'General',
      totalTickets: capacity || 100,
      availableTickets: capacity || 100,
      price: parseFloat(price),
      imageUrl: imageUrl || '',
      status: status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`event:${eventId}`, event);
    
    return c.json({ success: true, event });
  } catch (error) {
    console.log('Admin create event error:', error);
    return c.json({ error: 'Failed to create event' }, 500);
  }
});

app.put('/make-server-1eecec3b/admin/events/:id', requireAuth, requireAdmin, async (c) => {
  try {
    const eventId = c.req.param('id');
    const eventData = await c.req.json();
    
    const existingEvent = await kv.get(`event:${eventId}`);
    if (!existingEvent) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    const { title, description, date, location, price, capacity, category, imageUrl, status } = eventData;
    
    const updatedEvent = {
      ...existingEvent,
      title: title || existingEvent.title,
      description: description !== undefined ? description : existingEvent.description,
      dateTime: date ? new Date(date).toISOString() : existingEvent.dateTime,
      location: location || existingEvent.location,
      type: category || existingEvent.type,
      totalTickets: capacity !== undefined ? capacity : existingEvent.totalTickets,
      availableTickets: capacity !== undefined 
        ? capacity - (existingEvent.totalTickets - existingEvent.availableTickets)
        : existingEvent.availableTickets,
      price: price !== undefined ? parseFloat(price) : existingEvent.price,
      imageUrl: imageUrl !== undefined ? imageUrl : existingEvent.imageUrl,
      status: status || existingEvent.status,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`event:${eventId}`, updatedEvent);
    
    return c.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.log('Admin update event error:', error);
    return c.json({ error: 'Failed to update event' }, 500);
  }
});

app.delete('/make-server-1eecec3b/admin/events/:id', requireAuth, requireAdmin, async (c) => {
  try {
    const eventId = c.req.param('id');
    
    const event = await kv.get(`event:${eventId}`);
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    // Check if there are any bookings for this event
    const bookings = await kv.getByPrefix('booking:');
    const eventBookings = bookings.filter(booking => booking.eventId === eventId);
    
    if (eventBookings.length > 0) {
      return c.json({ error: 'Cannot delete event with existing bookings' }, 400);
    }
    
    await kv.del(`event:${eventId}`);
    
    return c.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.log('Admin delete event error:', error);
    return c.json({ error: 'Failed to delete event' }, 500);
  }
});

Deno.serve(app.fetch);