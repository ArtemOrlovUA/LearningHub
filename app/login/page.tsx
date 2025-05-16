'use client';

import supabase from '@/app/utils/client';
import LogoutButton from '@/app/_components/LogoutButton';
import { useUser } from '../utils/useUser';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const { user, loading } = useUser();
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const [limitCheckInitiated, setLimitCheckInitiated] = useState(false);

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
          console.log(`Checking/ensuring user_limits for ${user.id}`);
          const { data: existingLimits, error: fetchError } = await supabase
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
            } else {
              console.log(`user_limits record created for ${user.id}.`);
            }
          } else if (fetchError) {
            console.error('Error fetching user_limits on login page:', fetchError);
          } else if (existingLimits) {
            console.log(`user_limits record already exists for ${user.id}.`);
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
        redirectTo: `${window.location.origin}/learn`,
      },
    });

    if (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  if (showLoadingIndicator) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}>
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}>
      {user ? (
        <>
          <h1>Welcome</h1>
          <p>Email: {user.email}</p>
          <LogoutButton />
          <Link href="/learn">Learn</Link>
        </>
      ) : (
        <>
          <h1>Login</h1>
          <button
            onClick={handleSignInWithGoogle}
            style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
            Sign in with Google
          </button>
        </>
      )}
    </div>
  );
}
