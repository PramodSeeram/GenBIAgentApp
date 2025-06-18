import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { GoogleSignIn } from '@/components/GoogleSignIn';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Login successful!');
        navigate('/home');
      } else {
        toast.error(data.detail || 'Login failed');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    }
  };

  const handleGoogleSuccess = (data: any) => {
    toast.success(`Welcome ${data.user?.name || ''}!`);
    navigate('/home');
  };

  const handleGoogleError = (error: Error) => {
    toast.error(`Sign in failed: ${error.message}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center hero-gradient relative">
      {/* Theme toggle button in top-right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="container max-w-6xl px-4 py-10 mx-auto">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col justify-center text-white animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Chat4BA</h1>
            <p className="text-xl md:text-2xl mb-6">
              Your intelligent business analytics companion
            </p>
            <ul className="space-y-4 text-lg">
              <li className="flex items-start">
                <div className="mr-2 bg-white/20 p-1 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                Connect to any data source with ease
              </li>
              <li className="flex items-start">
                <div className="mr-2 bg-white/20 p-1 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                Query your data in natural language
              </li>
              <li className="flex items-start">
                <div className="mr-2 bg-white/20 p-1 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                Build customizable dashboards in seconds
              </li>
            </ul>
          </div>

          <div className="flex justify-center items-center">
            <Card className="w-full max-w-md animate-fade-in">
              <CardHeader>
                <CardTitle className="text-2xl">Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleEmailLogin}>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">Email</label>
                      <Input 
                        id="email" 
                        placeholder="name@company.com" 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-medium">Password</label>
                        <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                      <Input 
                        id="password" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full">
                    Sign In
                  </Button>
                  
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  
                  <GoogleSignIn 
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                  />
                  
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                    <img src="/logos/microsoft.svg" alt="Microsoft" className="h-5 w-5" />
                    Sign in with Microsoft
                  </Button>
                </CardFooter>
              </form>
              
              <div className="px-8 pb-6 text-center text-sm">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
