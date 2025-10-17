# Supabase Setup Guide for Event Management Application

This guide will help you set up your Supabase project for the event management application with proper database tables, security policies, and authentication.

## Step 1: Database Setup

1. **Open your Supabase project dashboard**
2. **Go to the SQL Editor**
3. **Copy and paste the entire content of `database-schema.sql`** into the SQL editor
4. **Run the script** by clicking "Run"

This will create:
- All necessary tables (users, events, bookings, cart_items, etc.)
- Row Level Security (RLS) policies
- Triggers for data management
- Sample Indian market data

## Step 2: Enable Authentication Providers

### Email Authentication (Already enabled)
- Email/password authentication is enabled by default

### Social Authentication Setup

#### Google OAuth
1. Go to **Authentication > Providers** in your Supabase dashboard
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - **Client ID**: Get from Google Cloud Console
   - **Client Secret**: Get from Google Cloud Console
   - **Redirect URL**: `https://nkgejttsnlhqdffitxrz.supabase.co/auth/v1/callback`

#### Facebook OAuth
1. Enable **Facebook** provider
2. Add your Facebook App credentials:
   - **Client ID**: Get from Facebook Developers
   - **Client Secret**: Get from Facebook Developers

#### GitHub OAuth
1. Enable **GitHub** provider
2. Add your GitHub OAuth App credentials:
   - **Client ID**: Get from GitHub Developer Settings
   - **Client Secret**: Get from GitHub Developer Settings

## Step 3: Configure Email Templates (Optional)

1. Go to **Authentication > Email Templates**
2. Customize the confirmation and password reset emails for your brand
3. Add your company logo and Indian contact information

## Step 4: Set Up Storage (If using file uploads)

1. Go to **Storage**
2. Create a bucket called `event-images`
3. Set up appropriate policies for public read access

## Step 5: Create an Admin User

### Option 1: Using the Dashboard
1. Go to **Authentication > Users**
2. Click **Add User**
3. Enter admin email and password
4. After creation, go to **SQL Editor** and run:
```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

### Option 2: Using the SQL Function
Run this in the SQL Editor:
```sql
SELECT public.create_admin_user('admin@yourdomain.com');
```

## Step 6: Test the Application

1. **Test User Registration**: Try creating a new user account
2. **Test Login**: Sign in with the created account
3. **Test Admin Access**: Login with admin credentials and access admin dashboard
4. **Test Events**: Browse events and check if sample data is loaded
5. **Test Booking**: Try booking an event
6. **Test Cart**: Add items to cart and checkout

## Step 7: Environment Configuration

Your application is already configured to use:
- **Project ID**: `nkgejttsnlhqdffitxrz`
- **Anon Key**: Already set in `/utils/supabase/info.tsx`

## Step 8: Deploy and Configure Domain (Production)

For production deployment:

1. **Update Site URL** in Supabase dashboard:
   - Go to **Authentication > URL Configuration**
   - Set **Site URL** to your production domain
   - Add your domain to **Redirect URLs**

2. **Configure CORS** if needed:
   - Add your domain to allowed origins

## Database Tables Created

The schema creates these main tables:

### Core Tables
- **users**: User profiles with role management
- **events**: Event listings with Indian market data
- **bookings**: Event bookings and payments
- **cart_items**: Shopping cart functionality

### Supporting Tables
- **user_sessions**: Session tracking
- **admin_analytics**: Admin dashboard metrics
- **reviews**: Event reviews and ratings
- **notifications**: User notification system
- **event_categories**: Event categorization

## Security Features

- **Row Level Security (RLS)** enabled on all tables
- **User isolation**: Users can only access their own data
- **Admin privileges**: Admins can access management functions
- **Secure APIs**: All database operations through Supabase client

## Sample Data Included

The schema includes sample events for Indian cities:
- Mumbai Music Festival 2025
- Delhi Tech Conference 2025
- Bangalore Food Festival
- Kolkata Cultural Festival

## Monitoring and Analytics

Your admin dashboard will show:
- Total events, bookings, users
- Revenue analytics
- User activity tracking
- Booking statistics

## Troubleshooting

### Common Issues:

1. **RLS Policies**: If you can't access data, check RLS policies
2. **Admin Access**: Ensure user role is set to 'admin'
3. **Auth Issues**: Check redirect URLs and provider configuration
4. **CORS Errors**: Add your domain to allowed origins

### SQL Commands for Debugging:

```sql
-- Check user roles
SELECT id, email, role FROM public.users;

-- Check RLS policies
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies WHERE schemaname = 'public';

-- Check table data
SELECT COUNT(*) FROM public.events;
SELECT COUNT(*) FROM public.users;
```

## Next Steps

After setup:
1. Customize event categories for your market
2. Add your own event data
3. Configure payment integration (Razorpay for India)
4. Set up email notifications
5. Add more detailed analytics
6. Implement advanced features like reviews and recommendations

Your application is now ready to handle real users and data with full database persistence!