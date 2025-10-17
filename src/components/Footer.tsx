import React from 'react';
import { Calendar, Mail, Phone, MapPin, Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold">EventHub</span>
            </div>
            <p className="text-muted-foreground text-sm mb-6">
              Discover and book amazing events in your area. From concerts to conferences, we've got you covered.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>support@eventhub.com</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Browse Events</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Popular Categories</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Event Organizers</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Mobile App</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Gift Cards</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Refund Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Newsletter & Social */}
          <div>
            <h3 className="font-semibold mb-4">Stay Connected</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Subscribe to get updates on new events and exclusive offers.
            </p>
            
            {/* Newsletter Signup */}
            <div className="flex space-x-2 mb-6">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1"
              />
              <Button size="sm">Subscribe</Button>
            </div>

            {/* Social Links */}
            <div>
              <p className="text-sm font-medium mb-3">Follow Us</p>
              <div className="flex space-x-3">
                <a 
                  href="#" 
                  className="p-2 bg-muted rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a 
                  href="#" 
                  className="p-2 bg-muted rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a 
                  href="#" 
                  className="p-2 bg-muted rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a 
                  href="#" 
                  className="p-2 bg-muted rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-muted-foreground text-sm">
              © 2025 EventHub. All rights reserved. Built with React and Tailwind CSS.
            </div>
            
            {/* Payment Methods */}
            <div className="flex items-center space-x-4">
              <span className="text-muted-foreground text-sm">Secure payments:</span>
              <div className="flex space-x-2">
                <div className="px-2 py-1 bg-muted rounded text-xs font-medium">VISA</div>
                <div className="px-2 py-1 bg-muted rounded text-xs font-medium">MC</div>
                <div className="px-2 py-1 bg-muted rounded text-xs font-medium">AMEX</div>
                <div className="px-2 py-1 bg-muted rounded text-xs font-medium">PayPal</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}