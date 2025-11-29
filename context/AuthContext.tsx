import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<User>;
  logout: () => void;
  // Admin functions
  getAllUsers: () => Promise<User[]>;
  approveUser: (id: string) => Promise<void>;
  suspendUser: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const user = await authService.login(email, pass);
    setUser(user);
  };

  const register = async (name: string, email: string, pass: string) => {
    const newUser = await authService.register(name, email, pass);
    if (newUser.isApproved) {
        setUser(newUser);
    }
    return newUser;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
        user, 
        isLoading, 
        isAdmin,
        login, 
        register, 
        logout,
        getAllUsers: authService.getAllUsers,
        approveUser: authService.approveUser,
        suspendUser: authService.suspendUser,
        deleteUser: authService.deleteUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};