import { useState, useEffect } from 'react';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import supabase from '@/app/utils/client';

/**
 * Custom hook to manage user authentication state.
 * It fetches the current user and listens for authentication state changes.
 * @returns {{ user: User | null, loading: boolean }} An object containing the user and loading state.
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const {
          data: { user: currentUser },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error('Error getting current user:', error);
        }
        setUser(currentUser);
      } catch (e) {
        console.error('Exception in getCurrentUser:', e);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        setLoading(false);
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
