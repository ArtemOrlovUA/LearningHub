import { useState, useEffect } from 'react';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import supabase from '@/app/utils/client'; // Corrected import path

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
          // Potentially set user to null or handle error state
        }
        setUser(currentUser);
      } catch (e) {
        console.error('Exception in getCurrentUser:', e);
      } finally {
        // This will be the primary place to set loading to false after initial check.
        setLoading(false);
      }
    };

    getCurrentUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        // If an auth event occurs (login/logout), we are no longer in the initial loading phase.
        setLoading(false);
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // Empty dependency array: run only once on mount

  return { user, loading };
}
