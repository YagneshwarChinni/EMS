import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', category: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help with your account and bookings',
      value: 'support@eventhub.in',
      action: 'mailto:support@eventhub.in'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Call us for immediate assistance',
      value: '+91 98765 43210',
      action: 'tel:+919876543210'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team',
      value: 'Available 24/7',
      action: '#'
    }
  ];

  const officeInfo = [
    {
      icon: MapPin,
      title: 'Office Address',
      details: ['123 MG Road, Brigade Gateway', 'Bangalore, Karnataka 560025', 'India']
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: ['Monday - Friday: 9:00 AM - 6:00 PM IST', 'Saturday: 10:00 AM - 4:00 PM IST', 'Sunday: Closed']
    },
    {
      icon: Users,
      title: 'Support Team',
      details: ['24/7 Emergency Support', 'Hindi & English Assistance', 'Expert Event Consultants']
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Have questions about events, bookings, or need assistance? We're here to help!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center space-x-2 bg-card px-4 py-2 rounded-full border">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-medium">Event Planning</span>
              </div>
              <div className="flex items-center space-x-2 bg-card px-4 py-2 rounded-full border">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">Customer Support</span>
              </div>
              <div className="flex items-center space-x-2 bg-card px-4 py-2 rounded-full border">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">24/7 Assistance</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Send className="h-6 w-6" />
                    <span>Send us a Message</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Your full name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="your.email@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="booking">Booking Support</SelectItem>
                          <SelectItem value="technical">Technical Issue</SelectItem>
                          <SelectItem value="event">Event Planning</SelectItem>
                          <SelectItem value="refund">Refund Request</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        type="text"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        placeholder="Brief description of your inquiry"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        placeholder="Please provide details about your inquiry..."
                        className="min-h-[120px]"
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>Sending...</>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* Quick Contact Methods */}
              <div>
                <h2 className="text-2xl font-semibold mb-6">Contact Methods</h2>
                <div className="space-y-4">
                  {contactMethods.map((method, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <method.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{method.title}</h3>
                            <p className="text-muted-foreground text-sm mb-2">{method.description}</p>
                            <a
                              href={method.action}
                              className="text-primary hover:underline font-medium"
                            >
                              {method.value}
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Office Information */}
              <div>
                <h2 className="text-2xl font-semibold mb-6">Office Information</h2>
                <div className="space-y-6">
                  {officeInfo.map((info, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="p-2 bg-secondary/20 rounded-lg">
                        <info.icon className="h-5 w-5 text-secondary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">{info.title}</h3>
                        <div className="space-y-1">
                          {info.details.map((detail, detailIndex) => (
                            <p key={detailIndex} className="text-muted-foreground text-sm">
                              {detail}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ Link */}
              <Card className="bg-accent/50">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Frequently Asked Questions</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Find quick answers to common questions about events, bookings, and our platform.
                  </p>
                  <Button variant="outline" size="sm">
                    View FAQ
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}