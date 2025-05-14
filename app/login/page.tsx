'use client';

import supabase from '@/app/utils/client';
import LogoutButton from '@/app/_components/LogoutButton';
import { useUser } from '../utils/useUser';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const { user, loading } = useUser();
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);

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

  const handleSignInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/learn`,
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
