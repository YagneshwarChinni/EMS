import React, { useState } from 'react';
import { useCart, useAuth } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Minus, Plus, Trash2, ShoppingBag, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { apiClient } from '../utils/api';

interface CartPageProps {
  onContinueShopping: () => void;
}

export function CartPage({ onContinueShopping }: CartPageProps) {
  const { cartItems, updateQuantity, removeFromCart, clearCart, getTotalPrice } = useCart();
  const { user, token } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQuantityChange = (eventId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(eventId);
      toast.success('Item removed from cart');
    } else {
      updateQuantity(eventId, newQuantity);
    }
  };

  const handleRemoveItem = (eventId: string, eventTitle: string) => {
    removeFromCart(eventId);
    toast.success(`${eventTitle} removed from cart`);
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please sign in to complete your purchase');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      // Process each cart item as a booking
      const bookingPromises = cartItems.map(async (item) => {
        try {
          return await apiClient.createBooking(
            token!,
            item.eventId,
            item.quantity,
            item.price * item.quantity
          );
        } catch (error) {
          throw new Error(`Failed to book ${item.eventTitle}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      await Promise.all(bookingPromises);
      
      clearCart();
      toast.success('All bookings completed successfully!');
      onContinueShopping(); // Redirect to home or dashboard
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to complete checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPrice = getTotalPrice();

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Button onClick={onContinueShopping} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </div>

          <Card className="text-center py-16">
            <CardContent>
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Discover amazing events and add them to your cart to get started.
              </p>
              <Button onClick={onContinueShopping}>
                Browse Events
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button onClick={onContinueShopping} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Shopping Cart</h1>
              <p className="text-muted-foreground">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
          </div>
          
          {cartItems.length > 0 && (
            <Button 
              onClick={clearCart} 
              variant="outline" 
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.eventId}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Event Image */}
                    <div className="w-full sm:w-32 h-32 flex-shrink-0">
                      <ImageWithFallback
                        src={item.eventImage || ''}
                        alt={item.eventTitle}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-lg">{item.eventTitle}</h3>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{new Date(item.eventDate).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{item.eventLocation}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="text-lg font-semibold">
                          ₹{item.price.toFixed(2)} each
                        </div>
                        <Badge variant="secondary">
                          Total: ₹{(item.price * item.quantity).toFixed(2)}
                        </Badge>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end space-y-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleQuantityChange(item.eventId, item.quantity - 1)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <Button
                          onClick={() => handleQuantityChange(item.eventId, item.quantity + 1)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        onClick={() => handleRemoveItem(item.eventId, item.eventTitle)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.eventId} className="flex justify-between text-sm">
                      <span>{item.eventTitle} × {item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Processing Fee</span>
                    <span>₹0.00</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>

                <div className="space-y-3 pt-4">
                  {!user ? (
                    <div className="text-center text-sm text-muted-foreground">
                      Please sign in to complete your purchase
                    </div>
                  ) : (
                    <Button 
                      onClick={handleCheckout}
                      className="w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : `Checkout - ₹${totalPrice.toFixed(2)}`}
                    </Button>
                  )}
                  
                  <Button 
                    onClick={onContinueShopping}
                    variant="outline"
                    className="w-full"
                  >
                    Continue Shopping
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground text-center pt-4">
                  Secure checkout powered by EventHub
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}