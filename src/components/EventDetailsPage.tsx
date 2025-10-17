import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, Clock, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useAuth, useCart } from '../App';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { apiClient } from '../utils/api';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';

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

interface EventDetailsPageProps {
  eventId: string;
  onBack: () => void;
  onBookNow: (eventId: string) => void;
}

export function EventDetailsPage({ eventId, onBack, onBookNow }: EventDetailsPageProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { user } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const data = await apiClient.getEvent(eventId);
      setEvent(data.event);
    } catch (error) {
      console.error('Error fetching event details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBookNow = () => {
    if (!user) {
      toast.error('Please sign in to book tickets');
      return;
    }
    onBookNow(eventId);
  };

  const handleAddToCart = () => {
    if (!event) return;
    
    const cartItem = {
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.dateTime,
      eventLocation: event.location,
      price: event.price,
      quantity: quantity,
      eventImage: event.imageUrl
    };

    addToCart(cartItem);
    toast.success(`Added ${quantity} ticket(s) to cart`);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (event && newQuantity > event.availableTickets) return;
    setQuantity(newQuantity);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
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
            Go back to events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Events
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Event Image */}
        <div className="relative h-64 md:h-96">
          <ImageWithFallback
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full">
            <span className="text-sm text-indigo-600">{event.type}</span>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Event Information */}
            <div className="lg:col-span-2">
              <h1 className="mb-4 text-gray-900">{event.title}</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-3 text-indigo-600" />
                  <div>
                    <p>{formatDate(event.dateTime)}</p>
                    <p className="text-sm">{formatTime(event.dateTime)}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-3 text-indigo-600" />
                  <p>{event.location}</p>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Users className="h-5 w-5 mr-3 text-indigo-600" />
                  <div>
                    <p>{event.availableTickets} tickets available</p>
                    <p className="text-sm">of {event.totalTickets} total</p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-3 text-indigo-600" />
                  <p>Duration: 3 hours</p>
                </div>
              </div>

              <div>
                <h2 className="mb-4 text-gray-900">About This Event</h2>
                <p className="text-gray-600 leading-relaxed">{event.description}</p>
              </div>
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold text-primary mb-2">₹{event.price}</p>
                    <p className="text-muted-foreground">per ticket</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Event Type:</span>
                      <Badge variant="secondary">{event.type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Available:</span>
                      <span className="font-medium">{event.availableTickets} tickets</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={event.availableTickets > 0 ? "default" : "destructive"}>
                        {event.availableTickets > 0 ? 'Available' : 'Sold Out'}
                      </Badge>
                    </div>
                  </div>

                  {event.availableTickets > 0 && (
                    <>
                      <Separator className="my-6" />
                      
                      {/* Quantity Selector */}
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Quantity:</span>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(quantity - 1)}
                              disabled={quantity <= 1}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-medium">{quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(quantity + 1)}
                              disabled={quantity >= event.availableTickets}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total:</span>
                          <span>₹{(event.price * quantity).toFixed(2)}</span>
                        </div>
                      </div>

                      <Separator className="my-6" />
                    </>
                  )}

                  <div className="space-y-3">
                    {event.availableTickets > 0 ? (
                      <>
                        <Button
                          onClick={handleAddToCart}
                          variant="outline"
                          className="w-full"
                          disabled={!user}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                        
                        <Button
                          onClick={handleBookNow}
                          className="w-full"
                          disabled={!user}
                        >
                          Book Now
                        </Button>
                      </>
                    ) : (
                      <Button disabled className="w-full">
                        Sold Out
                      </Button>
                    )}

                    {!user && (
                      <p className="text-sm text-muted-foreground text-center">
                        Please sign in to book tickets
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}