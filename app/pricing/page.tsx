import PlanCard from '../_components/PlanCard';
import Link from 'next/link';

export default function PricingPage() {
  const plans = {
    free: {
      planName: 'Hobby',
      price: 'Free',
      priceFrequency: 'No payment required',
      features: ['120 flashcards per month'],
      buttonText: 'Get Started',
      buttonLink: '/login',
    },
    pro: {
      planName: 'Pro',
      price: '20',
      priceFrequency: '/month',
      highlightText: 'Even more flashcards!',
      features: ['500 flashcards per month', '500 answers per month'],
      buttonText: 'Upgrade to Pro',
      buttonLink: '/',
      isHighlighted: true,
    },
  };

  return (
    <div className="min-h-full bg-black text-white flex flex-col items-center pt-5 md:pt-10 p-6">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white">Choose Your Plan</h1>
        <p className="text-lg text-slate-400 mt-4">Simple, transparent pricing. No hidden fees.</p>
      </header>

      <main className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <PlanCard
            planName={plans.free.planName}
            price={plans.free.price}
            priceFrequency={plans.free.priceFrequency}
            features={plans.free.features}
            buttonText={plans.free.buttonText}
            buttonLink={plans.free.buttonLink}
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
      </main>

      <footer className="text-slate-500 text-[1.2rem] mt-12 mb-6 text-center">
        <p>All prices are in USD. You can cancel your subscription at any time.</p>
        <p className="mt-2">
          Need a custom plan?{' '}
          <Link href="/contact" className="text-blue-400 hover:text-blue-300">
            Contact us
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
