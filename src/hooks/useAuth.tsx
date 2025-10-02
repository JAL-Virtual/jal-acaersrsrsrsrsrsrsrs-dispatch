'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, ACARSMessage, ACARSSettings } from '@/types';
import { JALVirtualAPI, HoppieAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (apiKey: string) => Promise<boolean>;
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
      } catch (error) {
        localStorage.removeItem('jal-acars-user');
        localStorage.removeItem('jal-acars-token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (apiKey: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const jalAPI = new JALVirtualAPI(apiKey);
      const authResponse = await jalAPI.authenticate();
      
      if (authResponse.success && authResponse.user && authResponse.token) {
        setUser(authResponse.user);
        localStorage.setItem('jal-acars-user', JSON.stringify(authResponse.user));
        localStorage.setItem('jal-acars-token', authResponse.token);
        toast.success(`Welcome back, ${authResponse.user.name}!`);
        return true;
      } else {
        toast.error(authResponse.message || 'Login failed');
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error types
      if (error.message?.includes('timeout')) {
        toast.error('Connection timeout. Please check your internet connection.');
      } else if (error.message?.includes('Network Error') || error.message?.includes('ECONNREFUSED')) {
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
