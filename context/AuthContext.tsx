'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile } from '@/types/database';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  setAuthSession: (user: { id: string; email: string } | null, profile: Profile | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('lm_user');
      const savedProfile = localStorage.getItem('lm_profile');
      if (savedUser && savedProfile) {
        setUser(JSON.parse(savedUser));
        setProfile(JSON.parse(savedProfile));
      } else {
        // Default demo account as Admin for rich instant testing if non-authenticated
        const mockAdminProfile: Profile = {
          id: 'admin-001',
          email: 'admin@lm-luxury.com',
          full_name: 'Directeur L&M',
          role: 'admin',
          avatar_url: null,
          created_at: new Date().toISOString(),
        };
        setUser({ id: mockAdminProfile.id, email: mockAdminProfile.email });
        setProfile(mockAdminProfile);
        document.cookie = `lm_user_role=admin; path=/`;
        document.cookie = `lm_auth_session=true; path=/`;
      }
    } catch (e) {
      console.error('Failed to parse auth state', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const setAuthSession = (
    newUser: { id: string; email: string } | null,
    newProfile: Profile | null
  ) => {
    setUser(newUser);
    setProfile(newProfile);
    if (newUser && newProfile) {
      localStorage.setItem('lm_user', JSON.stringify(newUser));
      localStorage.setItem('lm_profile', JSON.stringify(newProfile));
      document.cookie = `lm_user_role=${newProfile.role}; path=/`;
      document.cookie = `lm_auth_session=true; path=/`;
    } else {
      localStorage.removeItem('lm_user');
      localStorage.removeItem('lm_profile');
      document.cookie = `lm_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `lm_auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  };

  const logout = () => {
    setAuthSession(null, null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        setAuthSession,
        logout,
      }}
    >
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
