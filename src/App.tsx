import React, { useState, useEffect, createContext, useContext, Suspense, lazy } from 'react';
import { Navigation } from './components/Navigation';

import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './components/ui/sonner';
import { apiClient } from './utils/api';
import { supabase, getCurrentUser } from './utils/supabase/client';
import type { User as SupabaseUser } from './utils/supabase/client';

// Lazy load components to improve initial load time
const HomePage = lazy(() => import('./components/HomePage').then(module => ({ default: module.HomePage })));
const EventDetailsPage = lazy(() => import('./components/EventDetailsPage').then(module => ({ default: module.EventDetailsPage })));
const AuthPage = lazy(() => import('./components/AuthPage').then(module => ({ default: module.AuthPage })));
const UserDashboard = lazy(() => import('./components/UserDashboard').then(module => ({ default: module.UserDashboard })));
const BookingPage = lazy(() => import('./components/BookingPage').then(module => ({ default: module.BookingPage })));
const CartPage = lazy(() => import('./components/CartPage').then(module => ({ default: module.CartPage })));
const ContactPage = lazy(() => import('./components/ContactPage').then(module => ({ default: module.ContactPage })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminEventManagement = lazy(() => import('./components/AdminEventManagement').then(module => ({ default: module.AdminEventManagement })));

// Loading component
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Types
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
}

interface CartItem {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  price: number;
  quantity: number;
  eventImage?: string;
}

// Auth Context
interface AuthContextType {
  user: User | null;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signInWithSocial: (provider: 'google' | 'facebook' | 'github') => Promise<void>;
  signOut: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Cart Context
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (eventId: string) => void;
  updateQuantity: (eventId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// App State
type Page = 'home' | 'event-details' | 'auth' | 'dashboard' | 'booking' | 'cart' | 'contact' | 'admin' | 'admin-events';

interface AppState {
  currentPage: Page;
  selectedEventId: string | null;
  bookingEventId: string | null;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    currentPage: 'home',
    selectedEventId: null,
    bookingEventId: null,
  });

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Initialize auth state and cart
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get current Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const profile = await getCurrentUser();
          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              firstName: profile.first_name,
              lastName: profile.last_name,
              isAdmin: profile.role === 'admin'
            });
            setToken(session.access_token);
          }
        }

        // Load cart from localStorage
        const savedCart = localStorage.getItem('cartItems');
        if (savedCart) {
          try {
            const cartData = JSON.parse(savedCart);
            setCartItems(Array.isArray(cartData) ? cartData : []);
          } catch (error) {
            console.error('Error parsing saved cart data:', error);
            localStorage.removeItem('cartItems');
          }
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await getCurrentUser();
        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            firstName: profile.first_name,
            lastName: profile.last_name,
            isAdmin: profile.role === 'admin'
          });
          setToken(session.access_token);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save cart to localStorage whenever it changes (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [cartItems]);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      const data = await apiClient.signIn(email, password);
      // User state will be updated by the auth state change listener
      
      // Redirect based on user role
      const profile = await getCurrentUser();
      if (profile?.role === 'admin') {
        setAppState({ currentPage: 'admin', selectedEventId: null, bookingEventId: null });
      } else {
        setAppState({ currentPage: 'home', selectedEventId: null, bookingEventId: null });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string): Promise<void> => {
    try {
      const data = await apiClient.signUp(email, password, firstName, lastName);
      // User state will be updated by the auth state change listener
      setAppState({ currentPage: 'home', selectedEventId: null, bookingEventId: null });
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signInWithSocial = async (provider: 'google' | 'facebook' | 'github'): Promise<void> => {
    try {
      await apiClient.signInWithSocial(provider);
      // The redirect will happen automatically after OAuth completes
    } catch (error) {
      console.error('Social sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // User state will be updated by the auth state change listener
      setAppState({ currentPage: 'home', selectedEventId: null, bookingEventId: null });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const navigateTo = React.useCallback((page: Page, eventId?: string) => {
    setAppState(prev => ({
      currentPage: page,
      selectedEventId: page === 'event-details' ? eventId || null : prev.selectedEventId,
      bookingEventId: page === 'booking' ? eventId || null : prev.bookingEventId,
    }));
  }, []);

  // Cart functions with useCallback to prevent unnecessary re-renders
  const addToCart = React.useCallback((item: CartItem) => {
    setCartItems(prev => {
      const existingItem = prev.find(cartItem => cartItem.eventId === item.eventId);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.eventId === item.eventId
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        );
      }
      return [...prev, item];
    });
  }, []);

  const removeFromCart = React.useCallback((eventId: string) => {
    setCartItems(prev => prev.filter(item => item.eventId !== eventId));
  }, []);

  const updateQuantity = React.useCallback((eventId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.eventId !== eventId));
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.eventId === eventId ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = React.useCallback(() => {
    setCartItems([]);
  }, []);

  const getTotalPrice = React.useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cartItems]);

  const getTotalItems = React.useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const authContextValue = React.useMemo<AuthContextType>(() => ({
    user,
    token,
    signIn,
    signUp,
    signInWithSocial,
    signOut,
    isLoading,
  }), [user, token, isLoading]);

  const cartContextValue = React.useMemo<CartContextType>(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  }), [cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getTotalPrice, getTotalItems]);

  const renderCurrentPage = () => {
    if (isLoading) {
      return <PageLoader />;
    }

    switch (appState.currentPage) {
      case 'home':
        return (
          <Suspense fallback={<PageLoader />}>
            <HomePage onEventSelect={(eventId) => navigateTo('event-details', eventId)} />
          </Suspense>
        );
      case 'event-details':
        if (!appState.selectedEventId) {
          navigateTo('home');
          return <PageLoader />;
        }
        return (
          <Suspense fallback={<PageLoader />}>
            <EventDetailsPage
              eventId={appState.selectedEventId}
              onBack={() => navigateTo('home')}
              onBookNow={(eventId) => navigateTo('booking', eventId)}
            />
          </Suspense>
        );
      case 'auth':
        return (
          <Suspense fallback={<PageLoader />}>
            <AuthPage />
          </Suspense>
        );
      case 'dashboard':
        if (!user) {
          navigateTo('auth');
          return <PageLoader />;
        }
        return (
          <Suspense fallback={<PageLoader />}>
            <UserDashboard onEventSelect={(eventId) => navigateTo('event-details', eventId)} />
          </Suspense>
        );
      case 'booking':
        if (!appState.bookingEventId || !user) {
          navigateTo('home');
          return <PageLoader />;
        }
        return (
          <Suspense fallback={<PageLoader />}>
            <BookingPage
              eventId={appState.bookingEventId}
              onBack={() => navigateTo('event-details', appState.bookingEventId!)}
              onBookingComplete={() => navigateTo('dashboard')}
            />
          </Suspense>
        );
      case 'cart':
        return (
          <Suspense fallback={<PageLoader />}>
            <CartPage onContinueShopping={() => navigateTo('home')} />
          </Suspense>
        );
      case 'contact':
        return (
          <Suspense fallback={<PageLoader />}>
            <ContactPage />
          </Suspense>
        );
      case 'admin':
        if (!user?.isAdmin) {
          navigateTo('home');
          return <PageLoader />;
        }
        return (
          <Suspense fallback={<PageLoader />}>
            <AdminDashboard onManageEvents={() => navigateTo('admin-events')} />
          </Suspense>
        );
      case 'admin-events':
        if (!user?.isAdmin) {
          navigateTo('home');
          return <PageLoader />;
        }
        return (
          <Suspense fallback={<PageLoader />}>
            <AdminEventManagement onBack={() => navigateTo('admin')} />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<PageLoader />}>
            <HomePage onEventSelect={(eventId) => navigateTo('event-details', eventId)} />
          </Suspense>
        );
    }
  };

  return (
    <ErrorBoundary>
      <AuthContext.Provider value={authContextValue}>
        <CartContext.Provider value={cartContextValue}>
          <div className="min-h-screen bg-background flex flex-col">
            <ErrorBoundary>
              <Navigation
                onHomeClick={() => navigateTo('home')}
                onSignInClick={() => navigateTo('auth')}
                onSignUpClick={() => navigateTo('auth')}
                onDashboardClick={() => navigateTo('dashboard')}
                onCartClick={() => navigateTo('cart')}
                onContactClick={() => navigateTo('contact')}
                onAdminClick={() => navigateTo('admin')}
              />
            </ErrorBoundary>
            
            <main className="flex-1">
              <ErrorBoundary>
                {renderCurrentPage()}
              </ErrorBoundary>
            </main>
            

            <Toaster />
          </div>
        </CartContext.Provider>
      </AuthContext.Provider>
    </ErrorBoundary>
  );
}