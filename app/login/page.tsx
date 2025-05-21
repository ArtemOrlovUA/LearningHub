'use client';

import supabase from '@/app/utils/client';
import { useUser } from '../utils/useUser';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const { user, loading } = useUser();
  const [showLoadingIndicator, setShowLoadingIndicator] = useState<boolean>(false);
  const [limitCheckInitiated, setLimitCheckInitiated] = useState<boolean>(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => {
        setShowLoadingIndicator(true);
      }, 300);
    } else {
      setShowLoadingIndicator(false);
    }

    return () => {
      clearTimeout(timer);
      if (!loading) {
        setShowLoadingIndicator(false);
      }
    };
  }, [loading]);

  useEffect(() => {
    const ensureUserLimits = async () => {
      if (user && !loading && !limitCheckInitiated) {
        setLimitCheckInitiated(true);
        try {
          const { error: fetchError } = await supabase
            .from('user_limits')
            .select('user_id')
            .eq('user_id', user.id)
            .single();

          if (fetchError && fetchError.code === 'PGRST116') {
            console.log(`No user_limits found for ${user.id}, creating one.`);
            const { error: insertError } = await supabase
              .from('user_limits')
              .insert({ user_id: user.id });

            if (insertError) {
              console.error('Error creating user_limits record:', insertError);
            }
          } else if (fetchError) {
            console.error('Error fetching user_limits on login page:', fetchError);
          }
        } catch (e) {
          console.error('Unexpected error in ensureUserLimits on login page:', e);
        }
      }
    };

    ensureUserLimits();
  }, [user, loading, limitCheckInitiated]);

  useEffect(() => {
    if (!user) {
      setLimitCheckInitiated(false);
    }
  }, [user]);

  const handleSignInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/learn`,
      },
    });

    if (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  if (showLoadingIndicator) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-slate-100">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-slate-100">
      {user ? (
        <>
          <h1 className="text-2xl font-semibold mb-4 text-white">Welcome</h1>
          <p className="mb-2 text-slate-300">Email: {user.email}</p>

          <Link href="/learn" className="mt-4 text-sky-400 hover:text-sky-300 hover:underline">
            Learn
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-8 text-white">Login</h1>
          <button
            onClick={handleSignInWithGoogle}
            className="px-6 py-3 bg-white text-black text-lg font-medium rounded-md shadow-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition-colors duration-150">
            Sign in with Google
          </button>
        </>
      )}
    </div>
  );
}
