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
    setIsLoggingOut(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error logging out:', error.message);
      router.refresh();
      setIsLoggingOut(false);
    } else {
      router.push('/login');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="py-2 px-4 text-base cursor-pointer text-red-500 border border-red-500 hover:bg-red-500 hover:text-white rounded w-24 transition-colors duration-150 ease-in-out">
      Logout
    </button>
  );
}
