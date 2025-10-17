import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

console.log("EventHub server starting...")

// Simple in-memory storage with enhanced user session tracking
const data = {
  users: new Map(),
  events: new Map(),
  bookings: new Map(),
  userEmails: new Map(),
  userSessions: new Map(), // Track active user sessions
  loginHistory: new Map(), // Store login history for each user
  signupStats: {
    totalSignups: 0,
    dailySignups: new Map(),
    monthlySignups: new Map()
  },
  initialized: false
}

// Helper function to track user activity
function trackUserActivity(userId: string, action: string, details = {}) {
  const timestamp = new Date().toISOString()
  const activity = {
    userId,
    action,
    timestamp,
    details,
    ip: 'unknown', // In a real app, you'd get this from request headers
    userAgent: 'unknown'
  }
  
  // Store in user's login history
  if (!data.loginHistory.has(userId)) {
    data.loginHistory.set(userId, [])
  }
  data.loginHistory.get(userId).push(activity)
  
  console.log(`User Activity: ${userId} - ${action} at ${timestamp}`)
}

// Initialize sample data
function initializeData() {
  if (data.initialized) return
  
  console.log("Initializing sample data...")
  
  // Test user
  const testUserId = "test-user-123"
  const testUser = {
    id: testUserId,
    email: 'test@example.com',
    password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // 'password123'
    firstName: 'Test',
    lastName: 'User',
    isAdmin: false,
    createdAt: new Date().toISOString(),
  }
  data.users.set(testUserId, testUser)
  data.userEmails.set('test@example.com', testUserId)

  // Admin user
  const adminUserId = "admin-user-123"
  const adminUser = {
    id: adminUserId,
    email: 'admin@example.com',
    password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // 'admin123'
    firstName: 'Admin',
    lastName: 'User',
    isAdmin: true,
    createdAt: new Date().toISOString(),
  }
  data.users.set(adminUserId, adminUser)
  data.userEmails.set('admin@example.com', adminUserId)

  // Sample events (Indian localization)
  const events = [
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
  ]

  events.forEach(event => data.events.set(event.id, event))
  data.initialized = true
  console.log("Sample data initialized successfully")
}

// Hash password
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password))
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Generate enhanced token with session tracking
function generateToken(userId: string): string {
  const sessionId = crypto.randomUUID()
  const tokenData = { 
    userId, 
    sessionId,
    exp: Date.now() + 24 * 60 * 60 * 1000,
    iat: Date.now() 
  }
  
  // Store session information
  data.userSessions.set(sessionId, {
    userId,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    isActive: true
  })
  
  return btoa(JSON.stringify(tokenData))
}

// Verify enhanced token with session validation
function verifyToken(token: string): { userId: string, sessionId?: string } | null {
  try {
    const decoded = JSON.parse(atob(token))
    if (!decoded.userId || decoded.exp < Date.now()) return null
    
    // If sessionId exists, validate the session
    if (decoded.sessionId) {
      const session = data.userSessions.get(decoded.sessionId)
      if (!session || !session.isActive) {
        return null
      }
      
      // Update last activity
      session.lastActivity = new Date().toISOString()
      data.userSessions.set(decoded.sessionId, session)
    }
    
    return { userId: decoded.userId, sessionId: decoded.sessionId }
  } catch {
    return null
  }
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    initializeData()
    
    const url = new URL(req.url)
    const path = url.pathname

    console.log(`${req.method} ${path}`)

    // Health check
    if (path.endsWith('/health')) {
      return new Response(
        JSON.stringify({ 
          status: 'ok', 
          message: 'EventHub API is running',
          timestamp: new Date().toISOString(),
          endpoints: ['health', 'events', 'signin', 'signup', 'bookings']
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get events
    if (path.endsWith('/events') && req.method === 'GET') {
      const events = Array.from(data.events.values())
      return new Response(
        JSON.stringify({ events }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get single event
    if (path.includes('/events/') && req.method === 'GET') {
      const eventId = path.split('/events/')[1]
      const event = data.events.get(eventId)
      
      if (!event) {
        return new Response(
          JSON.stringify({ error: 'Event not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ event }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sign up
    if (path.endsWith('/signup') && req.method === 'POST') {
      const { email, password, firstName, lastName } = await req.json()
      
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate password strength
      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 6 characters long' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (data.userEmails.has(email)) {
        return new Response(
          JSON.stringify({ error: 'User already exists with this email' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const userId = crypto.randomUUID()
      const hashedPassword = await hashPassword(password)
      const currentDate = new Date()
      const dateKey = currentDate.toISOString().split('T')[0] // YYYY-MM-DD
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      
      const user = {
        id: userId,
        email,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        isAdmin: false,
        createdAt: currentDate.toISOString(),
        lastLogin: currentDate.toISOString(),
        loginCount: 1,
        isEmailVerified: false, // In a real app, you'd send verification email
        profile: {
          avatar: '',
          phone: '',
          city: '',
          state: '',
          country: 'India'
        }
      }

      // Store user data
      data.users.set(userId, user)
      data.userEmails.set(email, userId)
      
      // Track signup statistics
      data.signupStats.totalSignups++
      data.signupStats.dailySignups.set(dateKey, (data.signupStats.dailySignups.get(dateKey) || 0) + 1)
      data.signupStats.monthlySignups.set(monthKey, (data.signupStats.monthlySignups.get(monthKey) || 0) + 1)
      
      // Track user activity
      trackUserActivity(userId, 'signup', {
        method: 'email_password',
        firstName: firstName || '',
        lastName: lastName || ''
      })

      const token = generateToken(userId)
      
      console.log(`New user registered: ${email} (${userId})`)
      
      return new Response(
        JSON.stringify({ 
          user: { 
            id: userId, 
            email, 
            firstName: firstName || '', 
            lastName: lastName || '',
            isAdmin: false
          }, 
          token,
          message: 'Account created successfully! Welcome to EventHub.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sign in
    if (path.endsWith('/signin') && req.method === 'POST') {
      const { email, password } = await req.json()
      
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const userId = data.userEmails.get(email)
      if (!userId) {
        // Track failed login attempt
        trackUserActivity('unknown', 'failed_login', { email, reason: 'user_not_found' })
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const user = data.users.get(userId)
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const hashedPassword = await hashPassword(password)
      if (user.password !== hashedPassword) {
        // Track failed login attempt
        trackUserActivity(userId, 'failed_login', { email, reason: 'invalid_password' })
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update user login information
      const currentDate = new Date()
      user.lastLogin = currentDate.toISOString()
      user.loginCount = (user.loginCount || 0) + 1
      data.users.set(userId, user)
      
      // Track successful login
      trackUserActivity(userId, 'login', { 
        method: 'email_password',
        loginCount: user.loginCount
      })

      const token = generateToken(userId)
      
      console.log(`User signed in: ${email} (${userId}) - Login #${user.loginCount}`)
      
      return new Response(
        JSON.stringify({ 
          user: { 
            id: user.id, 
            email: user.email, 
            firstName: user.firstName, 
            lastName: user.lastName,
            isAdmin: user.isAdmin || false
          }, 
          token,
          message: `Welcome back, ${user.firstName || 'User'}!`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Social authentication
    if (path.endsWith('/auth/social') && req.method === 'POST') {
      const { provider } = await req.json()
      
      if (!provider || !['google', 'facebook', 'github'].includes(provider)) {
        return new Response(
          JSON.stringify({ error: 'Valid provider (google, facebook, github) is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Simulate OAuth flow with mock data (with Indian context)
      const mockSocialUsers = {
        google: {
          email: 'user@gmail.com',
          firstName: 'Arjun',
          lastName: 'Sharma',
          id: 'google-user-123'
        },
        facebook: {
          email: 'user@facebook.com',
          firstName: 'Priya',
          lastName: 'Patel',
          id: 'facebook-user-123'
        },
        github: {
          email: 'user@github.com',
          firstName: 'Rahul',
          lastName: 'Kumar',
          id: 'github-user-123'
        }
      }

      const socialUserData = mockSocialUsers[provider]
      
      // Check if social user already exists
      let userId = data.userEmails.get(socialUserData.email)
      let isNewUser = false
      
      if (!userId) {
        // Create new user from social data
        userId = socialUserData.id
        isNewUser = true
        const currentDate = new Date()
        const dateKey = currentDate.toISOString().split('T')[0]
        const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
        
        const user = {
          id: userId,
          email: socialUserData.email,
          password: '', // No password for social users
          firstName: socialUserData.firstName,
          lastName: socialUserData.lastName,
          isAdmin: false,
          createdAt: currentDate.toISOString(),
          lastLogin: currentDate.toISOString(),
          loginCount: 1,
          isEmailVerified: true, // Social accounts are pre-verified
          authProvider: provider,
          profile: {
            avatar: '',
            phone: '',
            city: '',
            state: '',
            country: 'India'
          }
        }

        data.users.set(userId, user)
        data.userEmails.set(socialUserData.email, userId)
        
        // Track signup statistics
        data.signupStats.totalSignups++
        data.signupStats.dailySignups.set(dateKey, (data.signupStats.dailySignups.get(dateKey) || 0) + 1)
        data.signupStats.monthlySignups.set(monthKey, (data.signupStats.monthlySignups.get(monthKey) || 0) + 1)
        
        // Track user activity
        trackUserActivity(userId, 'signup', {
          method: `social_${provider}`,
          firstName: socialUserData.firstName,
          lastName: socialUserData.lastName
        })
        
        console.log(`New social user registered via ${provider}: ${socialUserData.email} (${userId})`)
      } else {
        // Update existing user login info
        const user = data.users.get(userId)
        user.lastLogin = new Date().toISOString()
        user.loginCount = (user.loginCount || 0) + 1
        data.users.set(userId, user)
        
        // Track login activity
        trackUserActivity(userId, 'login', {
          method: `social_${provider}`,
          loginCount: user.loginCount
        })
        
        console.log(`Social user signed in via ${provider}: ${socialUserData.email} (${userId}) - Login #${user.loginCount}`)
      }

      const user = data.users.get(userId)
      const token = generateToken(userId)
      
      return new Response(
        JSON.stringify({ 
          user: { 
            id: user.id, 
            email: user.email, 
            firstName: user.firstName, 
            lastName: user.lastName,
            isAdmin: user.isAdmin || false
          }, 
          token,
          message: isNewUser ? 
            `Welcome to EventHub, ${user.firstName}! Your account has been created via ${provider}.` :
            `Welcome back, ${user.firstName}!`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create booking
    if (path.endsWith('/bookings') && req.method === 'POST') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const token = authHeader.substring(7)
      const payload = verifyToken(token)
      if (!payload) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { eventId, quantity, totalAmount } = await req.json()
      
      if (!eventId || !quantity || quantity < 1) {
        return new Response(
          JSON.stringify({ error: 'Event ID and valid quantity are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const event = data.events.get(eventId)
      if (!event) {
        return new Response(
          JSON.stringify({ error: 'Event not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (event.availableTickets < quantity) {
        return new Response(
          JSON.stringify({ error: `Not enough tickets available. Only ${event.availableTickets} tickets left.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const bookingId = crypto.randomUUID()
      const booking = {
        id: bookingId,
        userId: payload.userId,
        eventId,
        quantity,
        totalPrice: totalAmount || (event.price * quantity),
        bookingDate: new Date().toISOString(),
        status: 'Confirmed'
      }

      // Update event availability
      event.availableTickets -= quantity
      data.events.set(eventId, event)
      data.bookings.set(bookingId, booking)
      
      return new Response(
        JSON.stringify({ 
          success: true,
          booking: {
            ...booking,
            event: {
              title: event.title,
              dateTime: event.dateTime,
              location: event.location
            }
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user bookings
    if (path.endsWith('/user/bookings') && req.method === 'GET') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const token = authHeader.substring(7)
      const payload = verifyToken(token)
      if (!payload) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const userBookings = Array.from(data.bookings.values())
        .filter(booking => booking.userId === payload.userId)
        .map(booking => {
          const event = data.events.get(booking.eventId)
          return {
            ...booking,
            event: event ? {
              title: event.title,
              dateTime: event.dateTime,
              location: event.location,
              imageUrl: event.imageUrl
            } : null
          }
        })
      
      return new Response(
        JSON.stringify({ bookings: userBookings }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Admin endpoints
    if (path.includes('/admin/')) {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const token = authHeader.substring(7)
      const payload = verifyToken(token)
      if (!payload) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const user = data.users.get(payload.userId)
      if (!user || !user.isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Admin stats
      if (path.endsWith('/admin/stats')) {
        const totalRevenue = Array.from(data.bookings.values())
          .reduce((sum, booking) => sum + booking.totalPrice, 0)
        
        const activeEvents = Array.from(data.events.values())
          .filter(event => event.availableTickets > 0).length

        // Calculate user statistics
        const totalUsers = data.users.size
        const activeUsers = Array.from(data.userSessions.values())
          .filter(session => session.isActive).length
        
        const today = new Date().toISOString().split('T')[0]
        const todaySignups = data.signupStats.dailySignups.get(today) || 0
        
        // Calculate recent activity
        const recentActivity = []
        data.loginHistory.forEach((activities, userId) => {
          const recentUserActivity = activities.slice(-5) // Last 5 activities
          recentActivity.push(...recentUserActivity)
        })
        recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

        return new Response(
          JSON.stringify({
            totalEvents: data.events.size,
            totalBookings: data.bookings.size,
            totalRevenue,
            activeEvents,
            totalUsers,
            activeUsers,
            todaySignups,
            totalSignups: data.signupStats.totalSignups,
            recentActivity: recentActivity.slice(0, 10) // Last 10 activities
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Admin user analytics
      if (path.endsWith('/admin/users') && req.method === 'GET') {
        const users = Array.from(data.users.values()).map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin || false,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          loginCount: user.loginCount || 0,
          isEmailVerified: user.isEmailVerified || false,
          authProvider: user.authProvider || 'email'
        }))

        const userStats = {
          totalUsers: users.length,
          adminUsers: users.filter(u => u.isAdmin).length,
          verifiedUsers: users.filter(u => u.isEmailVerified).length,
          socialUsers: users.filter(u => u.authProvider && u.authProvider !== 'email').length,
          activeSessions: Array.from(data.userSessions.values()).filter(s => s.isActive).length
        }

        return new Response(
          JSON.stringify({
            users,
            stats: userStats,
            signupStats: {
              total: data.signupStats.totalSignups,
              daily: Object.fromEntries(data.signupStats.dailySignups),
              monthly: Object.fromEntries(data.signupStats.monthlySignups)
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Admin events
      if (path.endsWith('/admin/events')) {
        if (req.method === 'GET') {
          const events = Array.from(data.events.values()).map(event => {
            const eventBookings = Array.from(data.bookings.values())
              .filter(booking => booking.eventId === event.id)
            const bookingsCount = eventBookings.reduce((sum, booking) => sum + booking.quantity, 0)
            
            return {
              ...event,
              bookingsCount,
              status: event.availableTickets > 0 ? 'active' : 'sold-out',
              category: event.type,
              capacity: event.totalTickets,
              createdAt: new Date().toISOString(),
              date: event.dateTime
            }
          })

          return new Response(
            JSON.stringify({ events }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (req.method === 'POST') {
          const { title, description, date, location, price, capacity, category, imageUrl, status } = await req.json()
          
          if (!title || !date || !location || price === undefined) {
            return new Response(
              JSON.stringify({ error: 'Title, date, location, and price are required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          const eventId = crypto.randomUUID()
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
          }
          
          data.events.set(eventId, event)
          
          return new Response(
            JSON.stringify({ success: true, event }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Default response
    return new Response(
      JSON.stringify({ 
        message: 'EventHub API - Indian Event Management Platform',
        path,
        method: req.method,
        version: '2.0.0',
        features: [
          'User Authentication (Email/Password + Social)',
          'Event Management',
          'Booking System',
          'Admin Dashboard',
          'User Analytics',
          'Session Management'
        ],
        availableEndpoints: [
          '/health', 
          '/events', 
          '/signin', 
          '/signup', 
          '/auth/social', 
          '/bookings', 
          '/user/bookings', 
          '/admin/stats', 
          '/admin/events',
          '/admin/users'
        ],
        currency: 'INR (₹)',
        region: 'India'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})