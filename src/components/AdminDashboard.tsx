import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  Plus,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { apiClient } from '../utils/api';
import { projectId } from '../utils/supabase/info';

interface AdminDashboardProps {
  onManageEvents: () => void;
}

interface DashboardStats {
  totalEvents: number;
  totalBookings: number;
  totalRevenue: number;
  activeEvents: number;
}

interface RecentBooking {
  id: string;
  eventTitle: string;
  userEmail: string;
  quantity: number;
  totalAmount: number;
  bookingDate: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  price: number;
  capacity: number;
  bookingsCount: number;
  status: 'active' | 'draft' | 'cancelled';
}

export function AdminDashboard({ onManageEvents }: AdminDashboardProps) {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeEvents: 0
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access the admin dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats
      try {
        const statsData = await apiClient.getAdminStats(token);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }

      // Fetch recent bookings
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const bookingsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1eecec3b/admin/bookings?limit=10`,
          {
            signal: controller.signal,
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        clearTimeout(timeoutId);

        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          setRecentBookings(bookingsData.bookings || []);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        // Continue with empty bookings array
      }

      // Fetch events
      try {
        const eventsData = await apiClient.getAdminEvents(token);
        setEvents(eventsData.events || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: 'up' | 'down';
    trendValue?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && trendValue && (
              <div className={`flex items-center mt-2 text-sm ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`h-4 w-4 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getStatusBadge = (status: string) => {
    const variants = {
      confirmed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
      active: 'default',
      draft: 'secondary'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user.firstName || user.email}
            </p>
          </div>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <Button onClick={onManageEvents} className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Manage Events</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            icon={Calendar}
            trend="up"
            trendValue="+12%"
          />
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={Users}
            trend="up"
            trendValue="+8%"
          />
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend="up"
            trendValue="+15%"
          />
          <StatCard
            title="Active Events"
            value={stats.activeEvents}
            icon={CheckCircle}
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Recent Bookings</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={onManageEvents} className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Event
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Platform Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Revenue Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Revenue chart coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {recentBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No bookings found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{booking.eventTitle}</h4>
                          <p className="text-sm text-muted-foreground">{booking.userEmail}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(booking.bookingDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          <div>
                            <span className="font-medium">₹{booking.totalAmount}</span>
                            <span className="text-muted-foreground ml-2">({booking.quantity} tickets)</span>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Events Management</CardTitle>
                  <Button onClick={onManageEvents}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No events found</p>
                    <Button onClick={onManageEvents} className="mt-4">
                      Create Your First Event
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.slice(0, 5).map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">{event.location}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          <div>
                            <span className="font-medium">₹{event.price}</span>
                            <span className="text-muted-foreground ml-2">
                              ({event.bookingsCount}/{event.capacity})
                            </span>
                          </div>
                          {getStatusBadge(event.status)}
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {events.length > 5 && (
                      <Button onClick={onManageEvents} variant="outline" className="w-full">
                        View All Events ({events.length})
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}