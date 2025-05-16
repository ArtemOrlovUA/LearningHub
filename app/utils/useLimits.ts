import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import supabase from '@/app/utils/client';
import { useUser } from '@/app/utils/useUser';
import { DEFAULT_LIMIT, DEFAULT_LIMIT_START } from '@/app-config';

interface UserLimits {
  fc_limit: number;
  fc_current: number;
}

interface UseUserLimitsReturn extends UserLimits {
  loading: boolean;
  error: Error | null;
  refetchLimits: () => Promise<void>;
}

const DEFAULT_FC_LIMIT = 120;
const DEFAULT_FC_CURRENT = 0;

/**
 * Custom hook to fetch user-specific flashcard generation limits.
 * It retrieves fc_limit and fc_current from the 'user_limits' table.
 * If no user is authenticated or no record exists, an error is set.
 * Provides a function to manually refetch limits.
 * @returns {{ fc_limit: number, fc_current: number, loading: boolean, error: Error | null, refetchLimits: () => Promise<void> }}
 */
export function useUserLimits(): UseUserLimitsReturn {
  const { user, loading: userLoading } = useUser();
  const [fc_limit_state, setFcLimitState] = useState<number>(DEFAULT_FC_LIMIT);
  const [fc_current_state, setFcCurrentState] = useState<number>(DEFAULT_FC_CURRENT);
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
        .select('fc_limit, fc_current')
        .eq('user_id', currentUser.id)
        .single();

      if (supabaseError) {
        console.log('supabaseError', supabaseError);

        if (supabaseError.code === 'PGRST116') {
          throw new Error('Could not find user limits. Please contact support.');
        } else {
          throw supabaseError;
        }
      }

      if (data) {
        setFcLimitState(data.fc_limit);
        setFcCurrentState(data.fc_current);
      } else {
        setFcLimitState(DEFAULT_LIMIT);
        setFcCurrentState(DEFAULT_LIMIT_START);
      }
    } catch (err) {
      console.error('Error fetching user limits:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user limits'));
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
    loading,
    error,
    refetchLimits: refetch,
  };
}
