'use client';

import supabase from '@/app/utils/client';
import { useRouter } from 'next/navigation';
import type { Dispatch, SetStateAction } from 'react';

interface LogoutButtonProps {
  setIsLoggingOut: Dispatch<SetStateAction<boolean>>;
}

/**
 * Renders a logout button and handles the Supabase sign-out process.
 */
export default function LogoutButton({ setIsLoggingOut }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true); // Indicate that logout process has started
    const { error } = await supabase.auth.signOut();

    if (error) {
      // If sign-out fails, log the error and refresh the current page.
      console.error('Error logging out:', error.message);
      router.refresh();
      setIsLoggingOut(false); // Reset logging out state if refresh doesn't unmount
    } else {
      // If sign-out is successful, redirect the user to the login page.
      // setIsLoggingOut(false) is not strictly necessary here as the component will unmount on redirect.
      router.push('/login');
    }
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: '10px 20px',
        fontSize: '16px',
        cursor: 'pointer',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        width: '6rem',
      }}>
      Logout
    </button>
  );
}
