'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (pilotId: string, apiKey: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored authentication on mount
    const storedUser = localStorage.getItem('jal-acars-user');
    const storedToken = localStorage.getItem('jal-acars-token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('jal-acars-user');
        localStorage.removeItem('jal-acars-token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (pilotId: string, apiKey: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pilotId,
          apiKey,
        }),
      });

      const data = await response.json();

      if (data.success && data.user && data.token) {
        setUser(data.user);
        localStorage.setItem('jal-acars-user', JSON.stringify(data.user));
        localStorage.setItem('jal-acars-token', data.token);
        toast.success(data.message || `Welcome back, ${data.user.name}!`);
        return true;
      } else {
        toast.error(data.message || 'Login failed');
        return false;
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      const err = error as { message?: string };
      
      // Handle specific error types
      if (err.message?.includes('timeout')) {
        toast.error('Connection timeout. Please check your internet connection.');
      } else if (err.message?.includes('Network Error') || err.message?.includes('ECONNREFUSED')) {
        toast.error('Unable to connect to JAL Virtual servers. Please check your internet connection or VPN settings.');
      } else {
        toast.error('Authentication error. Please try again.');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('jal-acars-user');
    localStorage.removeItem('jal-acars-token');
    toast.success('Logged out successfully');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('jal-acars-user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
