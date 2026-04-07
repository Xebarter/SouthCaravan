'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User, UserRole } from './types';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (params: { email: string; password: string; name?: string; company?: string; role?: UserRole }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_PORTAL_STORAGE_KEYS = [
  'currentVendorId',
  'currentVendorName',
  'currentServiceProviderName',
  'currentServiceProviderServices',
  'currentBuyerName',
  'currentBuyerEmail',
  'currentBuyerId',
  'currentBuyerPhone',
  'buyerProfile',
] as const;

function clearPortalHints() {
  for (const key of AUTH_PORTAL_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
}

function mapSupabaseUserToAppUser(supabaseUser: any): User | null {
  if (!supabaseUser?.id) return null;
  const meta = supabaseUser.app_metadata ?? {};
  const role = (meta.role as UserRole | undefined) ?? 'buyer';

  const name =
    supabaseUser.user_metadata?.name ||
    supabaseUser.user_metadata?.full_name ||
    (typeof supabaseUser.email === 'string' ? supabaseUser.email.split('@')[0] : 'User');

  const company = supabaseUser.user_metadata?.company as string | undefined;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    name,
    role,
    company,
    createdAt: new Date(supabaseUser.created_at ?? Date.now()),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();

    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        setUser(mapSupabaseUserToAppUser(data.user));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(mapSupabaseUserToAppUser(session?.user));
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const supabase = getBrowserSupabaseClient();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup: AuthContextType['signup'] = async ({ email, password, name, company, role }) => {
    const supabase = getBrowserSupabaseClient();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            company,
            role: role ?? 'buyer',
          },
        },
      });
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    const supabase = getBrowserSupabaseClient();
    setUser(null);
    clearPortalHints();
    void supabase.auth.signOut();
  };

  const value = useMemo(
    () => ({ user, isLoading, login, signup, logout }),
    [user, isLoading],
  );

  return (
    <AuthContext.Provider value={value}>
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
