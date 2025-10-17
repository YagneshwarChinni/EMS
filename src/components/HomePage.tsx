import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, MapPin, Plus, TrendingUp, Users, Clock, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useCart } from '../App';
import { apiClient } from '../utils/api';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';
import { DatabaseSetupNotice } from './DatabaseSetupNotice';

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

interface HomePageProps {
  onEventSelect: (eventId: string) => void;
}

export function HomePage({ onEventSelect }: HomePageProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const { addToCart } = useCart();

  const eventTypes = ['Concert', 'Conference', 'Workshop', 'Sports', 'Arts & Culture', 'Technology', 'Business'];

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, selectedType, selectedDate]);

  const fetchEvents = async () => {
    try {
      const data = await apiClient.getEvents();
      // Handle both mock data format and real Supabase format
      const eventsList = data.events || data.data || [];
      setEvents(eventsList);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events. Please check your database setup.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType && selectedType !== 'all') {
      filtered = filtered.filter(event => event.type === selectedType);
    }

    if (selectedDate) {
      filtered = filtered.filter(event =>
        event.dateTime.startsWith(selectedDate)
      );
    }

    setFilteredEvents(filtered);
  };

  const formatDate = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleQuickAddToCart = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    const cartItem = {
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.dateTime,
      eventLocation: event.location,
      price: event.price,
      quantity: 1,
      eventImage: event.imageUrl
    };
    addToCart(cartItem);
    toast.success(`Added "${event.title}" to cart`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedDate('');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Discovering amazing events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full mix-blend-multiply filter blur-xl animate-float opacity-70"></div>
        <div className="absolute top-2/3 right-1/4 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full mix-blend-multiply filter blur-xl animate-float opacity-70" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 left-1/2 w-72 h-72 bg-gradient-to-r from-pink-400/20 to-blue-400/20 rounded-full mix-blend-multiply filter blur-xl animate-float opacity-70" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-600/10 via-blue-600/5 to-pink-600/10 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Discover Amazing Events
              <motion.span
                className="inline-block ml-2"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                ✨
              </motion.span>
            </motion.h1>
            <motion.p 
              className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Find and book tickets for concerts, conferences, workshops, and more in your area.
            </motion.p>
            
            {/* Quick Stats */}
            <motion.div 
              className="flex flex-wrap justify-center gap-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <motion.div 
                className="flex items-center space-x-2 glass-card px-6 py-3 rounded-full hover:scale-105 transition-transform duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Calendar className="h-5 w-5 text-purple-600" />
                <span className="font-medium">{events.length}+ Events</span>
              </motion.div>
              <motion.div 
                className="flex items-center space-x-2 glass-card px-6 py-3 rounded-full hover:scale-105 transition-transform duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium">50k+ Attendees</span>
              </motion.div>
              <motion.div 
                className="flex items-center space-x-2 glass-card px-6 py-3 rounded-full hover:scale-105 transition-transform duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <TrendingUp className="h-5 w-5 text-pink-600" />
                <span className="font-medium">Top Rated</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Database Setup Notice */}
        <DatabaseSetupNotice />
        
        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Card className="mb-8 glass-card border-purple-200/30 shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search events, locations, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger>
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {eventTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  {(searchTerm || (selectedType && selectedType !== 'all') || selectedDate) && (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* Filter Results Summary */}
                {(searchTerm || (selectedType && selectedType !== 'all') || selectedDate) && (
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredEvents.length} of {events.length} events
                    {searchTerm && ` matching "${searchTerm}"`}
                    {selectedType && selectedType !== 'all' && ` in ${selectedType}`}
                    {selectedDate && ` on ${new Date(selectedDate).toLocaleDateString()}`}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || (selectedType && selectedType !== 'all') || selectedDate 
                  ? 'Try adjusting your search filters or browse all events.'
                  : 'Check back soon for new events!'
                }
              </p>
              {(searchTerm || (selectedType && selectedType !== 'all') || selectedDate) && (
                <Button onClick={clearFilters}>
                  View All Events
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.6 }}
                whileHover={{ scale: 1.02, y: -8 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="group overflow-hidden transition-all duration-300 cursor-pointer glass-card border-purple-200/30 shadow-lg hover:shadow-2xl hover:border-purple-300/50"
                  onClick={() => onEventSelect(event.id)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <ImageWithFallback
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm">
                        {event.type}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <div className="bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2">
                        <div className="text-sm font-medium">{formatDate(event.dateTime)}</div>
                        <div className="text-xs text-muted-foreground">{formatTime(event.dateTime)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{event.availableTickets} tickets remaining</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold text-primary">
                          ₹{event.price}
                        </div>
                        <div className="text-xs text-muted-foreground">per ticket</div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleQuickAddToCart(event, e)}
                          className="flex-shrink-0 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white hover:border-transparent transition-all duration-300"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventSelect(event.id);
                          }}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 hover:scale-105 transition-all duration-300"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Load More Button (if needed) */}
        {filteredEvents.length > 0 && events.length > filteredEvents.length && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Events
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}