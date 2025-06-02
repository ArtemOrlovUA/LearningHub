import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import supabase from '@/app/utils/client';
import { useUser } from '@/app/utils/useUser';

interface UserLimits {
  fc_limit: number;
  fc_current: number;
  q_limit: number;
  q_current: number;
}

interface UseUserLimitsReturn extends UserLimits {
  loading: boolean;
  error: Error | null;
  refetchLimits: () => Promise<void>;
}

const DEFAULT_FC_LIMIT = 120;
const DEFAULT_FC_CURRENT = 0;
const DEFAULT_Q_LIMIT = 15;
const DEFAULT_Q_CURRENT = 0;

/**
 * Custom hook to fetch user-specific generation limits for flashcards and quizzes.
 * It retrieves fc_limit, fc_current, q_limit, and q_current from the 'user_limits' table.
 * If no user is authenticated or no record exists, an error is set.
 * Provides a function to manually refetch limits.
 * @returns {{ fc_limit: number, fc_current: number, q_limit: number, q_current: number, loading: boolean, error: Error | null, refetchLimits: () => Promise<void> }}
 */
export function useUserLimits(): UseUserLimitsReturn {
  const { user, loading: userLoading } = useUser();
  const [fc_limit_state, setFcLimitState] = useState<number>(DEFAULT_FC_LIMIT);
  const [fc_current_state, setFcCurrentState] = useState<number>(DEFAULT_FC_CURRENT);
  const [q_limit_state, setQLimitState] = useState<number>(DEFAULT_Q_LIMIT);
  const [q_current_state, setQCurrentState] = useState<number>(DEFAULT_Q_CURRENT);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLimits = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setLoading(false);
      setError(new Error('User not authenticated. Cannot fetch limits.'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('user_limits')
        .select('fc_limit, fc_current, q_limit, q_current')
        .eq('user_id', currentUser.id)
        .single();

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          setFcLimitState(DEFAULT_FC_LIMIT);
          setFcCurrentState(DEFAULT_FC_CURRENT);
          setQLimitState(DEFAULT_Q_LIMIT);
          setQCurrentState(DEFAULT_Q_CURRENT);
          console.warn('User limits record not found, falling back to defaults.');
        } else {
          throw supabaseError;
        }
      }

      if (data) {
        setFcLimitState(data.fc_limit);
        setFcCurrentState(data.fc_current);
        setQLimitState(data.q_limit);
        setQCurrentState(data.q_current);
      } else {
        setFcLimitState(DEFAULT_FC_LIMIT);
        setFcCurrentState(DEFAULT_FC_CURRENT);
        setQLimitState(DEFAULT_Q_LIMIT);
        setQCurrentState(DEFAULT_Q_CURRENT);
        console.warn('No data received for user limits, falling back to defaults.');
      }
    } catch (err) {
      console.error('Error fetching user limits:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user limits'));
      setFcLimitState(DEFAULT_FC_LIMIT);
      setFcCurrentState(DEFAULT_FC_CURRENT);
      setQLimitState(DEFAULT_Q_LIMIT);
      setQCurrentState(DEFAULT_Q_CURRENT);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userLoading) {
      setLoading(true);
      setError(null);
      return;
    }
    fetchLimits(user);
  }, [user, userLoading, fetchLimits]);

  const refetch = async () => {
    await fetchLimits(user);
  };

  return {
    fc_limit: fc_limit_state,
    fc_current: fc_current_state,
    q_limit: q_limit_state,
    q_current: q_current_state,
    loading,
    error,
    refetchLimits: refetch,
  };
}
