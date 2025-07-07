"use client"

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Define the shape of your user object
interface User {
  id: string;
  email: string;
  fullName: string;
}

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('nexus-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('nexus-user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('nexus-user', JSON.stringify(userData));
  };

  
  const logout = () => {
    setUser(null);
  
    localStorage.removeItem('nexus-user');
    
    window.location.href = '/'; 
  };

  const isAuthenticated = !!user;

  const value = { user, login, logout, isAuthenticated, isLoading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access to the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};