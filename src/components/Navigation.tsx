import React, { useState } from 'react';
import { useAuth, useCart } from '../App';
import { Calendar, User, LogOut, ShoppingCart, Menu, X, Phone, Settings } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

interface NavigationProps {
  onHomeClick: () => void;
  onSignInClick: () => void;
  onSignUpClick: () => void;
  onDashboardClick: () => void;
  onCartClick: () => void;
  onContactClick: () => void;
  onAdminClick: () => void;
}

export function Navigation({ 
  onHomeClick, 
  onSignInClick, 
  onSignUpClick, 
  onDashboardClick,
  onCartClick,
  onContactClick,
  onAdminClick
}: NavigationProps) {
  const { user, signOut } = useAuth();
  const { getTotalItems } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const totalItems = getTotalItems();

  const handleMenuClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const NavLink = ({ onClick, children, icon, className = "" }: { 
    onClick: () => void; 
    children: React.ReactNode; 
    icon?: React.ReactNode;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 text-foreground hover:text-primary px-3 py-2 rounded-lg transition-colors ${className}`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );

  const MobileNavLink = ({ onClick, children, icon }: { 
    onClick: () => void; 
    children: React.ReactNode; 
    icon?: React.ReactNode;
  }) => (
    <button
      onClick={() => handleMenuClick(onClick)}
      className="flex items-center space-x-3 w-full text-left px-4 py-3 text-foreground hover:bg-accent rounded-lg transition-colors"
    >
      {icon}
      <span>{children}</span>
    </button>
  );

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={onHomeClick}
              className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
            >
              <Calendar className="h-8 w-8" />
              <span className="text-xl font-semibold">EventHub</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLink onClick={onHomeClick}>Events</NavLink>
            <NavLink onClick={onContactClick} icon={<Phone className="h-4 w-4" />}>
              Contact
            </NavLink>

            {/* Cart */}
            <button
              onClick={onCartClick}
              className="relative flex items-center space-x-1 text-foreground hover:text-primary px-3 py-2 rounded-lg transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Cart</span>
              {totalItems > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {totalItems}
                </Badge>
              )}
            </button>

            {user ? (
              <div className="flex items-center space-x-4">
                {user.isAdmin && (
                  <NavLink 
                    onClick={onAdminClick} 
                    icon={<Settings className="h-4 w-4" />}
                    className="bg-accent text-accent-foreground"
                  >
                    Admin
                  </NavLink>
                )}
                <NavLink onClick={onDashboardClick} icon={<User className="h-4 w-4" />}>
                  Dashboard
                </NavLink>
                <span className="text-muted-foreground hidden lg:block">
                  Welcome, {user.firstName || user.email.split('@')[0]}
                </span>
                <Button
                  onClick={signOut}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Button onClick={onSignUpClick} size="sm">
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-4">
            {/* Mobile Cart */}
            <button
              onClick={onCartClick}
              className="relative p-2 text-foreground hover:text-primary rounded-lg transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {totalItems}
                </Badge>
              )}
            </button>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  <div className="flex items-center space-x-2 px-4 py-2 border-b">
                    <Calendar className="h-6 w-6 text-primary" />
                    <span className="text-lg font-semibold">EventHub</span>
                  </div>

                  <div className="space-y-2">
                    <MobileNavLink onClick={onHomeClick}>Events</MobileNavLink>
                    <MobileNavLink onClick={onContactClick} icon={<Phone className="h-5 w-5" />}>
                      Contact
                    </MobileNavLink>
                    
                    {user ? (
                      <>
                        {user.isAdmin && (
                          <MobileNavLink onClick={onAdminClick} icon={<Settings className="h-5 w-5" />}>
                            Admin Dashboard
                          </MobileNavLink>
                        )}
                        <MobileNavLink onClick={onDashboardClick} icon={<User className="h-5 w-5" />}>
                          My Dashboard
                        </MobileNavLink>
                        
                        <div className="px-4 py-3 bg-accent rounded-lg mx-4">
                          <p className="text-sm text-muted-foreground">Signed in as</p>
                          <p className="font-medium">{user.firstName || user.email}</p>
                        </div>
                        
                        <div className="px-4">
                          <Button
                            onClick={() => handleMenuClick(signOut)}
                            variant="outline"
                            className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2 px-4">
                        <Button
                          onClick={() => handleMenuClick(onSignUpClick)}
                          className="w-full"
                        >
                          Sign Up
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}