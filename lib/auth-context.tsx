'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User, UserRole } from './types';
import { collectPortalRolesFromAuthUser, primaryPortalRole } from '@/lib/buyer-portal-access';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';

const POST_AUTH_NEXT_KEY = 'sc_post_auth_next';
const POST_AUTH_SET_AT_KEY = 'sc_post_auth_set_at';
const POST_AUTH_MAX_AGE_MS = 1000 * 60 * 5; // 5 minutes

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
  const roles = collectPortalRolesFromAuthUser(supabaseUser);
  const role = primaryPortalRole(roles.length > 0 ? roles : ['buyer']);

  const name =
    supabaseUser.user_metadata?.name ||
    supabaseUser.user_metadata?.full_name ||
    (typeof supabaseUser.email === 'string' ? supabaseUser.email.split('@')[0] : 'User');

  const company = supabaseUser.user_metadata?.company as string | undefined;
  const avatar = (
    supabaseUser.user_metadata?.avatar_url ||
    supabaseUser.user_metadata?.picture ||
    undefined
  ) as string | undefined;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    name,
    role,
    roles: roles.length > 0 ? roles : [role],
    company,
    avatar,
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

      // If OAuth ends up returning to the Site URL (often `/`) instead of our
      // intended `/auth?...` URL, automatically forward to the stored dashboard.
      if (session?.user && typeof window !== 'undefined') {
        try {
          const next = window.localStorage.getItem(POST_AUTH_NEXT_KEY) || '';
          const setAtRaw = window.localStorage.getItem(POST_AUTH_SET_AT_KEY) || '';
          const setAt = Number(setAtRaw);
          const fresh = Number.isFinite(setAt) ? Date.now() - setAt <= POST_AUTH_MAX_AGE_MS : false;

          if (fresh && next && next.startsWith('/')) {
            // Clear before navigating to avoid loops.
            window.localStorage.removeItem(POST_AUTH_NEXT_KEY);
            window.localStorage.removeItem(POST_AUTH_SET_AT_KEY);
            // Only auto-forward when we are on a public-ish surface (commonly `/`).
            if (window.location.pathname === '/' || window.location.pathname === '/login') {
              window.location.assign(next);
            }
          } else {
            // Stale hint; clear it.
            window.localStorage.removeItem(POST_AUTH_NEXT_KEY);
            window.localStorage.removeItem(POST_AUTH_SET_AT_KEY);
          }
        } catch {
          // non-fatal
        }
      }
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
    clearPortalHints();
    // Navigate immediately so console headers never re-render as signed-out
    // (which briefly showed mock vendor identity + a Sign in button).
    window.location.assign('/');
    const supabase = getBrowserSupabaseClient();
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
