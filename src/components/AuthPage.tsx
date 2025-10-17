import React, { useState } from 'react';
import { useAuth } from '../App';
import { LogIn, UserPlus, Eye, EyeOff, Github, Sparkles, Star, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { motion } from 'motion/react';

export function AuthPage() {
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });
  
  const [signUpData, setSignUpData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState({
    signIn: false,
    signUp: false,
    confirm: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('signin');

  const { signIn, signUp, signInWithSocial } = useAuth();

  const validateSignInForm = () => {
    const newErrors: Record<string, string> = {};

    if (!signInData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(signInData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!signInData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignUpForm = () => {
    const newErrors: Record<string, string> = {};

    if (!signUpData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!signUpData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!signUpData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(signUpData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!signUpData.password) {
      newErrors.password = 'Password is required';
    } else if (signUpData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!signUpData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (signUpData.password !== signUpData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateSignInForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await signIn(signInData.email, signInData.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateSignUpForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await signUp(signUpData.email, signUpData.password, signUpData.firstName, signUpData.lastName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'facebook' | 'github') => {
    setError('');
    setSocialLoading(provider);
    
    try {
      await signInWithSocial(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} sign in failed`);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleSignInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignInData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSignUpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignUpData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const SocialLoginButtons = () => (
    <motion.div 
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <Button
        variant="outline"
        className="w-full glass hover:scale-105 transition-all duration-300 hover:shadow-lg group"
        onClick={() => handleSocialSignIn('google')}
        disabled={isSocialLoading !== null}
      >
        {isSocialLoading === 'google' ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
        ) : (
          <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        Continue with Google
      </Button>

      <Button
        variant="outline"
        className="w-full glass hover:scale-105 transition-all duration-300 hover:shadow-lg group"
        onClick={() => handleSocialSignIn('facebook')}
        disabled={isSocialLoading !== null}
      >
        {isSocialLoading === 'facebook' ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
        ) : (
          <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="#1877F2" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        )}
        Continue with Facebook
      </Button>

      <Button
        variant="outline"
        className="w-full glass hover:scale-105 transition-all duration-300 hover:shadow-lg group"
        onClick={() => handleSocialSignIn('github')}
        disabled={isSocialLoading !== null}
      >
        {isSocialLoading === 'github' ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
        ) : (
          <Github className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
        )}
        Continue with GitHub
      </Button>
    </motion.div>
  );

  // Floating background elements
  const FloatingElements = () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute top-20 left-10 text-purple-300 opacity-20"
        animate={{ y: [-20, 20], rotate: [0, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles size={24} />
      </motion.div>
      <motion.div
        className="absolute top-40 right-20 text-blue-300 opacity-20"
        animate={{ y: [20, -20], rotate: [360, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Star size={20} />
      </motion.div>
      <motion.div
        className="absolute bottom-32 left-20 text-pink-300 opacity-20"
        animate={{ y: [-15, 15], rotate: [0, 180] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        <Heart size={18} />
      </motion.div>
      <motion.div
        className="absolute bottom-20 right-10 text-purple-300 opacity-20"
        animate={{ y: [10, -10], x: [-5, 5] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles size={22} />
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <FloatingElements />
      
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-gradient-to-r from-pink-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <motion.div 
        className="max-w-md w-full z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="glass-card border-white/20 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Welcome to EventHub
              </CardTitle>
              <CardDescription className="text-gray-600">
                Join thousands of event enthusiasts
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Alert variant="destructive" className="mb-6 glass border-red-300">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Demo Credentials Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Alert className="mb-6 glass border-blue-300 bg-blue-50/50">
                <AlertDescription className="text-sm">
                  <strong>Demo Credentials:</strong><br />
                  <span className="text-blue-700">Regular User:</span> test@example.com / password123<br />
                  <span className="text-purple-700">Admin User:</span> admin@example.com / admin123
                </AlertDescription>
              </Alert>
            </motion.div>

            {/* Social Login Buttons */}
            <SocialLoginButtons />

            <motion.div 
              className="relative my-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Separator className="bg-gradient-to-r from-transparent via-purple-300 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-4 text-muted-foreground text-sm rounded-full border border-purple-200">
                  Or continue with email
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 glass border border-purple-200">
                  <TabsTrigger 
                    value="signin" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white transition-all duration-300"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>

              <TabsContent value="signin" className="space-y-4 mt-6">
                <motion.form 
                  onSubmit={handleSignIn} 
                  className="space-y-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={signInData.email}
                      onChange={handleSignInChange}
                      placeholder="Enter your email"
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        name="password"
                        type={showPassword.signIn ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={signInData.password}
                        onChange={handleSignInChange}
                        placeholder="Enter your password"
                        className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, signIn: !prev.signIn }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword.signIn ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  {/* Quick Fill Buttons */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => {
                        setSignInData({ email: 'test@example.com', password: 'password123' });
                        setErrors({});
                      }}
                    >
                      Fill User
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => {
                        setSignInData({ email: 'admin@example.com', password: 'admin123' });
                        setErrors({});
                      }}
                    >
                      Fill Admin
                    </Button>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </motion.form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-6">
                <motion.form 
                  onSubmit={handleSignUp} 
                  className="space-y-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        value={signUpData.firstName}
                        onChange={handleSignUpChange}
                        placeholder="First name"
                        className={errors.firstName ? 'border-destructive' : ''}
                      />
                      {errors.firstName && (
                        <p className="text-sm text-destructive">{errors.firstName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        value={signUpData.lastName}
                        onChange={handleSignUpChange}
                        placeholder="Last name"
                        className={errors.lastName ? 'border-destructive' : ''}
                      />
                      {errors.lastName && (
                        <p className="text-sm text-destructive">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={signUpData.email}
                      onChange={handleSignUpChange}
                      placeholder="Enter your email"
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword.signUp ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={signUpData.password}
                        onChange={handleSignUpChange}
                        placeholder="Create password"
                        className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, signUp: !prev.signUp }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword.signUp ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword.confirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={signUpData.confirmPassword}
                        onChange={handleSignUpChange}
                        placeholder="Confirm password"
                        className={`pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword.confirm ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white border-0 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>
                </motion.form>
              </TabsContent>
              </Tabs>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}