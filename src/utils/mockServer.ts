// Mock server for development when Supabase edge functions are not available

interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  createdAt: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  type: string;
  totalTickets: number;
  availableTickets: number;
  price: number;
  imageUrl: string;
}

interface Booking {
  id: string;
  userId: string;
  eventId: string;
  quantity: number;
  totalPrice: number;
  bookingDate: string;
  status: string;
}

class MockServer {
  private users = new Map<string, User>();
  private events = new Map<string, Event>();
  private bookings = new Map<string, Booking>();
  private userEmails = new Map<string, string>();
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private generateToken(userId: string): string {
    return btoa(JSON.stringify({ userId, exp: Date.now() + 24 * 60 * 60 * 1000 }));
  }

  private verifyToken(token: string): { userId: string } | null {
    try {
      const decoded = JSON.parse(atob(token));
      if (!decoded.userId || decoded.exp < Date.now()) return null;
      return { userId: decoded.userId };
    } catch {
      return null;
    }
  }

  private async initialize() {
    if (this.initialized) return;

    // Test user
    const testUserId = 'test-user-123';
    const testUser: User = {
      id: testUserId,
      email: 'test@example.com',
      password: await this.hashPassword('password123'),
      firstName: 'Test',
      lastName: 'User',
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };
    this.users.set(testUserId, testUser);
    this.userEmails.set('test@example.com', testUserId);

    // Admin user
    const adminUserId = 'admin-user-123';
    const adminUser: User = {
      id: adminUserId,
      email: 'admin@example.com',
      password: await this.hashPassword('admin123'),
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true,
      createdAt: new Date().toISOString(),
    };
    this.users.set(adminUserId, adminUser);
    this.userEmails.set('admin@example.com', adminUserId);

    // Sample events
    const sampleEvents: Event[] = [
      {
        id: '1',
        title: 'React Developer Conference 2025',
        description: 'Join us for the biggest React conference of the year! Learn about the latest features, best practices, and connect with fellow developers.',
        dateTime: '2025-03-15T10:00:00Z',
        location: 'Bangalore International Exhibition Centre, Bangalore',
        type: 'Conference',
        totalTickets: 500,
        availableTickets: 350,
        price: 2500,
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: '2',
        title: 'Classical Music Concert',
        description: 'An enchanting evening of classical music featuring renowned Indian and international musicians.',
        dateTime: '2025-02-28T20:00:00Z',
        location: 'NCPA Theatre, Mumbai',
        type: 'Concert',
        totalTickets: 150,
        availableTickets: 75,
        price: 1200,
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: '3',
        title: 'Digital Marketing Workshop',
        description: 'Master the art of digital marketing with hands-on workshops covering SEO, social media, and content strategy.',
        dateTime: '2025-03-05T09:00:00Z',
        location: 'WeWork, Cyber City, Gurgaon',
        type: 'Workshop',
        totalTickets: 50,
        availableTickets: 25,
        price: 1500,
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: '4',
        title: 'IPL Cricket Match',
        description: 'Experience the thrill of live cricket with this exciting IPL match between top teams!',
        dateTime: '2025-04-12T19:00:00Z',
        location: 'M. Chinnaswamy Stadium, Bangalore',
        type: 'Sports',
        totalTickets: 20000,
        availableTickets: 15000,
        price: 800,
        imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: '5',
        title: 'Contemporary Art Exhibition',
        description: 'Discover stunning contemporary art from emerging Indian artists at this exclusive gallery opening.',
        dateTime: '2025-03-20T18:00:00Z',
        location: 'National Gallery of Modern Art, Delhi',
        type: 'Arts & Culture',
        totalTickets: 200,
        availableTickets: 180,
        price: 300,
        imageUrl: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      }
    ];

    sampleEvents.forEach(event => this.events.set(event.id, event));
    this.initialized = true;
    console.log('Mock server initialized with sample data');
  }

  async signUp(email: string, password: string, firstName: string, lastName: string) {
    await this.initialize();

    if (this.userEmails.has(email)) {
      throw new Error('User already exists with this email');
    }

    const userId = crypto.randomUUID();
    const hashedPassword = await this.hashPassword(password);
    
    const user: User = {
      id: userId,
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };

    this.users.set(userId, user);
    this.userEmails.set(email, userId);

    const token = this.generateToken(userId);
    
    return { 
      user: { 
        id: userId, 
        email, 
        firstName: firstName || '', 
        lastName: lastName || '',
        isAdmin: false
      }, 
      token 
    };
  }

  async signIn(email: string, password: string) {
    await this.initialize();

    const userId = this.userEmails.get(email);
    if (!userId) {
      throw new Error('Invalid credentials');
    }

    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const hashedPassword = await this.hashPassword(password);
    if (user.password !== hashedPassword) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(userId);
    
    return { 
      user: { 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName,
        isAdmin: user.isAdmin || false
      }, 
      token 
    };
  }

  async signInWithSocial(provider: 'google' | 'facebook' | 'github') {
    await this.initialize();

    // Simulate OAuth flow with mock data
    const mockSocialUsers = {
      google: {
        email: 'user@gmail.com',
        firstName: 'Google',
        lastName: 'User',
        id: 'google-user-123'
      },
      facebook: {
        email: 'user@facebook.com',
        firstName: 'Facebook',
        lastName: 'User',
        id: 'facebook-user-123'
      },
      github: {
        email: 'user@github.com',
        firstName: 'GitHub',
        lastName: 'User',
        id: 'github-user-123'
      }
    };

    const socialUserData = mockSocialUsers[provider];
    
    // Check if social user already exists
    let userId = this.userEmails.get(socialUserData.email);
    
    if (!userId) {
      // Create new user from social data
      userId = socialUserData.id;
      const user: User = {
        id: userId,
        email: socialUserData.email,
        password: '', // No password for social users
        firstName: socialUserData.firstName,
        lastName: socialUserData.lastName,
        isAdmin: false,
        createdAt: new Date().toISOString(),
      };

      this.users.set(userId, user);
      this.userEmails.set(socialUserData.email, userId);
    }

    const user = this.users.get(userId)!;
    const token = this.generateToken(userId);
    
    return { 
      user: { 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName,
        isAdmin: user.isAdmin || false
      }, 
      token 
    };
  }

  async getEvents() {
    await this.initialize();
    return { events: Array.from(this.events.values()) };
  }

  async getEvent(eventId: string) {
    await this.initialize();
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    return { event };
  }

  async createBooking(token: string, eventId: string, quantity: number, totalAmount?: number) {
    await this.initialize();

    const payload = this.verifyToken(token);
    if (!payload) {
      throw new Error('Invalid token');
    }

    const event = this.events.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.availableTickets < quantity) {
      throw new Error(`Not enough tickets available. Only ${event.availableTickets} tickets left.`);
    }

    const bookingId = crypto.randomUUID();
    const booking: Booking = {
      id: bookingId,
      userId: payload.userId,
      eventId,
      quantity,
      totalPrice: totalAmount || (event.price * quantity),
      bookingDate: new Date().toISOString(),
      status: 'Confirmed'
    };

    // Update event availability
    event.availableTickets -= quantity;
    this.events.set(eventId, event);
    this.bookings.set(bookingId, booking);
    
    return { 
      success: true,
      booking: {
        ...booking,
        event: {
          title: event.title,
          dateTime: event.dateTime,
          location: event.location
        }
      }
    };
  }

  async getUserBookings(token: string) {
    await this.initialize();

    const payload = this.verifyToken(token);
    if (!payload) {
      throw new Error('Invalid token');
    }

    const userBookings = Array.from(this.bookings.values())
      .filter(booking => booking.userId === payload.userId)
      .map(booking => {
        const event = this.events.get(booking.eventId);
        return {
          ...booking,
          event: event ? {
            title: event.title,
            dateTime: event.dateTime,
            location: event.location,
            imageUrl: event.imageUrl
          } : null
        };
      });
    
    return { bookings: userBookings };
  }

  async getAdminStats(token: string) {
    await this.initialize();

    const payload = this.verifyToken(token);
    if (!payload) {
      throw new Error('Invalid token');
    }

    const user = this.users.get(payload.userId);
    if (!user || !user.isAdmin) {
      throw new Error('Admin access required');
    }

    const totalRevenue = Array.from(this.bookings.values())
      .reduce((sum, booking) => sum + booking.totalPrice, 0);
    
    const activeEvents = Array.from(this.events.values())
      .filter(event => event.availableTickets > 0).length;

    return {
      totalEvents: this.events.size,
      totalBookings: this.bookings.size,
      totalRevenue,
      activeEvents
    };
  }

  async getAdminEvents(token: string) {
    await this.initialize();

    const payload = this.verifyToken(token);
    if (!payload) {
      throw new Error('Invalid token');
    }

    const user = this.users.get(payload.userId);
    if (!user || !user.isAdmin) {
      throw new Error('Admin access required');
    }

    const events = Array.from(this.events.values()).map(event => {
      const eventBookings = Array.from(this.bookings.values())
        .filter(booking => booking.eventId === event.id);
      const bookingsCount = eventBookings.reduce((sum, booking) => sum + booking.quantity, 0);
      
      return {
        ...event,
        bookingsCount,
        status: event.availableTickets > 0 ? 'active' : 'sold-out',
        category: event.type,
        capacity: event.totalTickets,
        createdAt: new Date().toISOString(),
        date: event.dateTime
      };
    });

    return { events };
  }

  async createAdminEvent(token: string, eventData: any) {
    await this.initialize();

    const payload = this.verifyToken(token);
    if (!payload) {
      throw new Error('Invalid token');
    }

    const user = this.users.get(payload.userId);
    if (!user || !user.isAdmin) {
      throw new Error('Admin access required');
    }

    const { title, description, date, location, price, capacity, category, imageUrl, status } = eventData;
    
    if (!title || !date || !location || price === undefined) {
      throw new Error('Title, date, location, and price are required');
    }
    
    const eventId = crypto.randomUUID();
    const event: Event = {
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
    };
    
    this.events.set(eventId, event);
    
    return { success: true, event };
  }

  async getAdminUsers(token: string) {
    await this.initialize();

    const payload = this.verifyToken(token);
    if (!payload) {
      throw new Error('Invalid token');
    }

    const user = this.users.get(payload.userId);
    if (!user || !user.isAdmin) {
      throw new Error('Admin access required');
    }

    const users = Array.from(this.users.values()).map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      isAdmin: u.isAdmin || false,
      createdAt: u.createdAt,
      lastLogin: u.createdAt, // Mock last login as creation date
      loginCount: 1,
      isEmailVerified: true,
      authProvider: 'email'
    }));

    return {
      users,
      stats: {
        totalUsers: users.length,
        adminUsers: users.filter(u => u.isAdmin).length,
        verifiedUsers: users.length,
        socialUsers: 0,
        activeSessions: users.length
      },
      signupStats: {
        total: users.length,
        daily: {},
        monthly: {}
      }
    };
  }
}

export const mockServer = new MockServer();