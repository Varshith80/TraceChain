import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import type { AppRole } from '@/types/fabric';
import type { UserProfile, UserWithRole, SignUpData } from '@/types/auth';
import { signUp as apiSignUp, signIn as apiSignIn, signInWithGoogle as apiSignInWithGoogle, signOut as apiSignOut, getCurrentUser, getAuthToken } from '@/services/api/auth-api';

interface AuthContextType {
  user: UserWithRole | null;
  session: { token: string | null } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (data: SignUpData) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: (accessToken: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [session, setSession] = useState<{ token: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        return null;
      }

      const userData = await getCurrentUser();
      return userData;
    } catch (error) {
      logger.error('Failed to fetch user profile', error);
      // If token is invalid, clear it
      apiSignOut();
      return null;
    }
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    setSession(token ? { token } : null);

    if (token) {
      fetchUserProfile().then(profile => {
        setUser(profile);
        setIsLoading(false);
      });
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  const signUp = async (data: SignUpData): Promise<{ error: Error | null }> => {
    try {
      const response = await apiSignUp(data);
      const token = getAuthToken();
      setSession(token ? { token } : null);
      
      // Fetch user profile
      const profile = await fetchUserProfile();
      setUser(profile);
      
      return { error: null };
    } catch (err: any) {
      logger.error('Sign up error:', err);
      return { error: err instanceof Error ? err : new Error(err.message || 'Sign up failed') };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      await apiSignIn(email, password);
      const token = getAuthToken();
      setSession(token ? { token } : null);
      const profile = await fetchUserProfile();
      setUser(profile);
      return { error: null };
    } catch (err: any) {
      logger.error('Sign in error:', err);
      return { error: err instanceof Error ? err : new Error(err.message || 'Sign in failed') };
    }
  };

  const signInWithGoogle = async (accessToken: string): Promise<{ error: Error | null }> => {
    try {
      await apiSignInWithGoogle(accessToken);
      const token = getAuthToken();
      setSession(token ? { token } : null);
      const profile = await fetchUserProfile();
      setUser(profile);
      return { error: null };
    } catch (err: any) {
      logger.error('Google sign in error:', err);
      return { error: err instanceof Error ? err : new Error(err.message || 'Google sign-in failed') };
    }
  };

  const signOut = async () => {
    apiSignOut();
    setUser(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    const profile = await fetchUserProfile();
    setUser(profile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!session?.token && !!user,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
