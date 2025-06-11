'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import supabase from '../utils/client';
import { useState, useEffect } from 'react';
import { useUser } from '../utils/useUser';

export default function Header() {
  const { user, loading: authLoading } = useUser();
  const isLoggedIn = !!user;
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Effect to toggle body scroll based on mobile menu state
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('overflow-y-hidden');
    } else {
      document.body.classList.remove('overflow-y-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-y-hidden');
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { href: '/pricing', label: 'Pricing' },
    { href: '/features', label: 'Features' },
  ];

  const userNavLinks = [
    { href: '/learn', label: 'Learn' },
    { href: '/my-flashcards', label: 'My Flashcards' },
    { href: '/my-quizzes', label: 'My Quizzes' },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setIsMobileMenuOpen(false);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out:', error.message);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (e) {
      console.error('Exception during logout:', e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const fullName = user?.user_metadata?.full_name;
  const email = user?.email;
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <>
      <nav className="bg-black text-white py-4 px-6 md:px-10 relative top-0 left-0 right-0 z-50 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold text-white"
            onClick={() => setIsMobileMenuOpen(false)}>
            LearningHub
          </Link>

          <div
            className={`hidden md:flex ${
              isLoggedIn ? 'ml-[4.5rem]' : 'ml-[2rem]'
            }  space-x-6 items-center`}>
            {isLoggedIn &&
              userNavLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="hover:text-gray-300 transition-colors duration-200">
                  {link.label}
                </Link>
              ))}
            {navLinks.slice(0, 2).map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-gray-300 transition-colors duration-200">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4 min-w-[200px] justify-end">
            {authLoading ? (
              <span className="text-sm text-gray-400">Loading...</span>
            ) : isLoggedIn && user ? (
              <>
                <Link
                  href="/account"
                  aria-label="User Account"
                  className="flex items-center space-x-2 p-1 rounded-md hover:bg-gray-700 transition-colors duration-200">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName || 'User Avatar'}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-6 w-6 text-white" />
                  )}
                </Link>
                {fullName && <span className="text-sm hidden md:inline">{fullName}</span>}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md text-sm transition-all duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-white text-black font-semibold py-2 px-4 rounded-md text-sm hover:bg-gray-200 transition-all duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75">
                Log in
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={toggleMobileMenu} aria-label="Toggle menu" disabled={isLoggingOut}>
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-8 w-8 text-white" />
              ) : (
                <Bars3Icon className="h-8 w-8 text-white" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Container */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-black bg-opacity-95 text-white flex flex-col pt-[calc(4rem+1px)] transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
        <div className="container mx-auto px-6 py-4 flex flex-col h-full">
          <div className="flex flex-col space-y-5 mb-8">
            {isLoggedIn &&
              userNavLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-xl hover:text-gray-300 transition-colors duration-200"
                  onClick={toggleMobileMenu}>
                  {link.label}
                </Link>
              ))}
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xl hover:text-gray-300 transition-colors duration-200"
                onClick={toggleMobileMenu}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-auto mb-6">
            {authLoading ? (
              <span className="text-sm text-gray-400 block text-center">Loading...</span>
            ) : isLoggedIn && user ? (
              <div className="border-t border-gray-700 pt-6">
                <div className="flex items-center mb-4 px-2">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName || 'User Avatar'}
                      className="h-10 w-10 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <UserIcon className="h-10 w-10 text-white mr-3" />
                  )}
                  <div className="text-left">
                    {fullName && <p className="font-semibold text-lg">{fullName}</p>}
                    {email && <p className="text-sm text-gray-400">{email}</p>}
                  </div>
                </div>
                <Link
                  href="/account"
                  className="block w-full text-left py-3 px-3 text-lg rounded-md hover:bg-gray-800 transition-colors duration-200"
                  onClick={toggleMobileMenu}>
                  Account Settings
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center justify-between w-full text-left py-3 px-3 text-lg rounded-md hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  <span>{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H5.25"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={toggleMobileMenu}
                className="block w-full bg-white text-black font-semibold py-3 px-6 rounded-lg text-lg text-center hover:bg-gray-200 transition-all duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75">
                Log in
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
