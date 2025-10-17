import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, CreditCard, Check } from 'lucide-react';
import { useAuth } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { ImageWithFallback } from './figma/ImageWithFallback';

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

interface BookingPageProps {
  eventId: string;
  onBack: () => void;
  onBookingComplete: () => void;
}

export function BookingPage({ eventId, onBack, onBookingComplete }: BookingPageProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [error, setError] = useState('');

  const { user, token } = useAuth();

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1eecec3b/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch event details');
      }

      const data = await response.json();
      setEvent(data.event);
    } catch (error) {
      console.error('Error fetching event details:', error);
      setError('Failed to load event details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!token || !event) return;

    setIsBooking(true);
    setError('');

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1eecec3b/events/${eventId}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        let errorMessage = 'Booking failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error('Booking failed with status:', response.status, 'Message:', errorMessage);
        throw new Error(errorMessage);
      }

      setBookingComplete(true);
      
      // Auto-redirect after 3 seconds
      setTimeout(() => {
        onBookingComplete();
      }, 3000);
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(error instanceof Error ? error.message : 'Booking failed');
    } finally {
      setIsBooking(false);
    }
  };

  const formatDate = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-gray-600">Event not found.</p>
          <button
            onClick={onBack}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-green-600 mb-4">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Your booking for {quantity} ticket{quantity > 1 ? 's' : ''} to "{event.title}" has been confirmed.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-gray-900 mb-2">Booking Details</h3>
            <div className="text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Event:</span>
                <span className="text-gray-900">{event.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="text-gray-900">{formatDate(event.dateTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="text-gray-900">{formatTime(event.dateTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="text-gray-900">{quantity} ticket{quantity > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Total:</span>
                <span className="text-indigo-600">${(event.price * quantity).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            You will be redirected to your dashboard in a few seconds...
          </p>
          <button
            onClick={onBookingComplete}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Event Details
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-gray-900">Complete Your Booking</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
          {/* Event Summary */}
          <div>
            <h2 className="mb-4 text-gray-900">Event Details</h2>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <ImageWithFallback
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-2">{event.title}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{formatDate(event.dateTime)} at {formatTime(event.dateTime)}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div>
            <h2 className="mb-4 text-gray-900">Booking Information</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Attendee Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-gray-900 mb-3">Attendee Information</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Name: {user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-gray-600">Email: {user?.email}</p>
                </div>
              </div>

              {/* Ticket Quantity */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Number of Tickets
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="w-16 text-center text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(event.availableTickets, quantity + 1))}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    disabled={quantity >= event.availableTickets}
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Maximum {Math.min(event.availableTickets, 10)} tickets per booking
                </p>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ticket Price:</span>
                    <span className="text-gray-900">${event.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="text-gray-900">{quantity}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-xl text-indigo-600">${(event.price * quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <CreditCard className="h-5 w-5 mr-2 text-gray-600" />
                  <h3 className="text-gray-900">Payment</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  This is a demo booking system. No actual payment will be processed.
                </p>
              </div>

              {/* Book Button */}
              <button
                onClick={handleBooking}
                disabled={isBooking || event.availableTickets < quantity}
                className={`w-full py-3 px-4 rounded-lg transition-colors ${
                  isBooking || event.availableTickets < quantity
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isBooking ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing Booking...
                  </div>
                ) : (
                  `Confirm Booking - $${(event.price * quantity).toFixed(2)}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}