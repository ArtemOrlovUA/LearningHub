'use client';

import { useUser } from '@/app/utils/useUser';
import { useUserLimits } from '@/app/utils/useLimits';
import { UserIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import ProfileCell from '../_components/ProfileCell';
import PlanCard from '../_components/PlanCard';

export default function AccountClient() {
  const { user, loading: userLoading } = useUser();
  const {
    fc_limit,
    fc_current,
    q_limit,
    q_current,
    loading: limitsLoading,
    error: limitsError,
    refetchLimits,
  } = useUserLimits();

  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email;

  const plans = {
    free: {
      planName: 'Hobby',
      price: 'Free',
      priceFrequency: 'No payment required',
      features: ['120 flashcards per month', '15 quizzes per month'],
      buttonText: 'Current Plan',
    },
    pro: {
      planName: 'Pro',
      price: '10',
      priceFrequency: '/month',
      highlightText: 'Even more flashcards and quizzes!',
      features: ['500 flashcards per month', '50 quizzes per month'],
      buttonText: 'Upgrade to Pro',
      buttonLink: '/',
      isHighlighted: true,
    },
  };

  if (userLoading) {
    return (
      <div className="min-h-full bg-black flex items-center justify-center text-white">
        <p>Loading user information...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-full bg-black flex flex-col items-center justify-center text-white p-6">
        <p className="text-xl mb-4">
          Could not load user profile. Please ensure you are logged in.
        </p>
        <Link
          href="/login"
          className="bg-white text-black font-semibold py-2 px-6 rounded-lg text-lg hover:bg-gray-200 mr-4">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-black text-white flex flex-col items-center pt-5 md:pt-10 p-6">
      <header className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white">Your Account</h1>
      </header>

      <main className="w-full max-w-4xl space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <ProfileCell title="Account Details">
            <div className="flex items-center space-x-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName || 'User Avatar'}
                  className="h-20 w-20 rounded-full object-cover border-2 border-gray-600"
                />
              ) : (
                <UserIcon className="h-20 w-20 text-gray-500 border-2 border-gray-600 rounded-full p-2" />
              )}
              <div>
                <p className="text-2xl font-semibold text-slate-100">{fullName || 'N/A'}</p>
                <p className="text-sm text-slate-400">{user.email}</p>
              </div>
            </div>
          </ProfileCell>

          <ProfileCell
            title="Usage Limits"
            isLoading={limitsLoading}
            errorText={limitsError?.message}>
            {fc_limit !== null && fc_current !== null ? (
              <>
                <p>
                  Flashcards Generated:{' '}
                  <span className="font-semibold">
                    {fc_current} / {fc_limit}
                  </span>
                </p>
                <p>
                  Quizzes Generated:{' '}
                  <span className="font-semibold">
                    {q_current} / {q_limit}
                  </span>
                </p>
              </>
            ) : (
              <p>Limits information not available.</p>
            )}
            {limitsError && (
              <button
                onClick={() => refetchLimits()}
                className="mt-3 text-sm text-blue-400 hover:text-blue-300 focus:outline-none">
                Retry
              </button>
            )}
          </ProfileCell>
        </div>

        <ProfileCell title="Current Subscription">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 items-stretch">
            <PlanCard
              planName={plans.free.planName}
              price={plans.free.price}
              features={plans.free.features}
              buttonText={plans.free.buttonText}
            />
            <PlanCard
              planName={plans.pro.planName}
              price={plans.pro.price}
              priceFrequency={plans.pro.priceFrequency}
              highlightText={plans.pro.highlightText}
              features={plans.pro.features}
              buttonText={plans.pro.buttonText}
              buttonLink={plans.pro.buttonLink}
              isHighlighted={plans.pro.isHighlighted}
            />
          </div>
        </ProfileCell>
      </main>
    </div>
  );
}
