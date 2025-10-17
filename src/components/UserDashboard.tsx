import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Calendar, MapPin, User, Edit3, Check, X } from 'lucide-react';
import { apiClient } from '../utils/api';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { DebugPanel } from './DebugPanel';

interface Booking {
  id: string;
  userId: string;
  eventId: string;
  quantity: number;
  totalPrice: number;
  bookingDate: string;
  status: string;
  event: {
    title: string;
    dateTime: string;
    location: string;
    imageUrl: string;
  };
}

interface UserDashboardProps {
  onEventSelect: (eventId: string) => void;
}

export function UserDashboard({ onEventSelect }: UserDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
  });
  const [activeTab, setActiveTab] = useState<'bookings' | 'profile'>('bookings');

  const { user, token } = useAuth();

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName,
        lastName: user.lastName,
      });
    }
    fetchBookings();
  }, [user, token]);

  const fetchBookings = async () => {
    if (!token) return;

    try {
      const data = await apiClient.getUserBookings(token);
      setBookings(data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!token) return;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1eecec3b/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setIsEditingProfile(false);
      // You might want to update the user context here as well
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const formatDate = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Welcome back, {user.firstName || user.email}!</h1>
        <p className="text-gray-600">Manage your bookings and profile settings.</p>
      </div>

      {/* Debug Panel - Temporary */}
      <DebugPanel />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-2 px-1 border-b-2 text-sm transition-colors ${
              activeTab === 'bookings'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 text-sm transition-colors ${
              activeTab === 'profile'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile Settings
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'bookings' && (
        <div>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-600 mb-6">Start exploring events and make your first booking!</p>
              <button
                onClick={() => onEventSelect('')}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Browse Events
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="relative h-48">
                    <ImageWithFallback
                      src={booking.event.imageUrl}
                      alt={booking.event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                      {booking.status}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="mb-2 text-gray-900">{booking.event.title}</h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{formatDate(booking.event.dateTime)} at {formatTime(booking.event.dateTime)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{booking.event.location}</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Quantity:</span>
                        <span className="text-sm">{booking.quantity} ticket{booking.quantity > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-gray-600">Total:</span>
                        <span className="text-lg text-indigo-600">${booking.totalPrice}</span>
                      </div>
                      
                      <button
                        onClick={() => onEventSelect(booking.eventId)}
                        className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        View Event Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900">Profile Information</h2>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
                <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    disabled={!isEditingProfile}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      isEditingProfile ? 'focus:ring-2 focus:ring-indigo-500' : 'bg-gray-50'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    disabled={!isEditingProfile}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      isEditingProfile ? 'focus:ring-2 focus:ring-indigo-500' : 'bg-gray-50'
                    }`}
                  />
                </div>
              </div>

              {isEditingProfile && (
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={updateProfile}
                    className="flex items-center space-x-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileData({
                        firstName: user.firstName,
                        lastName: user.lastName,
                      });
                    }}
                    className="flex items-center space-x-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}