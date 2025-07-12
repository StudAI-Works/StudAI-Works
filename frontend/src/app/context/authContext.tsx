"use client"

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// --- NEW: Define the shape of the user and the session we will store ---
interface User {
  id: string;
  email: string;
  fullName: string;
}

interface Session {
  user: User;
  token: string;
}

// --- UPDATE: Add getToken to the context type ---
interface AuthContextType {
  user: User | null;
  token: string | null; // Keep track of the token
  login: (sessionData: Session) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // --- UPDATE: We now store the entire session object ---
      const storedSession = localStorage.getItem('nexus-session');
      if (storedSession) {
        const session: Session = JSON.parse(storedSession);
        setUser(session.user);
        setToken(session.token);
      }
    } catch (error) {
      console.error("Failed to parse session from localStorage", error);
      localStorage.removeItem('nexus-session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (sessionData: Session) => {
    // --- UPDATE: Store the full session ---
    setUser(sessionData.user);
    setToken(sessionData.token);
    localStorage.setItem('nexus-session', JSON.stringify(sessionData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    // --- UPDATE: Clear the session, not just the user ---
    localStorage.removeItem('nexus-session');
    window.location.href = '/'; 
  };

  const isAuthenticated = !!user;

  const value = { user, token, login, logout, isAuthenticated, isLoading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};