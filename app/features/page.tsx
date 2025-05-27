import { FeatureCard } from '../_components/FeatureCard';
import Link from 'next/link';

const featuresData = [
  {
    id: 'ai-powered-learning',
    title: 'AI-Powered Learning',
    description: 'Generate flashcards and quizzes instantly from your notes or any topic.',
    imageUrl: '/aB2aNck1-_3prScQulmVv_a5c68e080ffa441ca2927abf4b44f789.png',
  },
  {
    id: 'text-extraction-support',
    title: 'Text extraction support',
    description: 'Extract text from PDFs easily.',
    imageUrl: '/YtP4WG6lctSvaD_hp_ZtX_1260f822750c4fe69f1e558427a57ba0.png',
  },
  {
    id: 'spaced-repetition',
    title: 'Spaced Repetition',
    description: 'Optimize your learning with our spaced repetition system.',
    imageUrl: '/vAsNcirDtHNoXKmJ2f4lf_7e6e46f52517498da0d3f0adde2a989d.png',
  },
  {
    id: 'flashcards-on-the-go',
    title: 'Flashcards on the go',
    description: 'Create flashcards from phone, tablet, or PC: no need to download an app.',
    imageUrl: '/1a41f726b56147beba33770de491cc51.png',
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center pt-5 md:pt-10 p-6">
      <header className="mb-10 md:mb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white">Powerful Features</h1>
        <p className="text-lg text-slate-400 mt-2">
          Discover what makes LearningHub the best platform for your studies.
        </p>
      </header>

      <main className="w-full max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {featuresData.map((feature) => (
            <FeatureCard
              key={feature.id}
              title={feature.title}
              description={feature.description}
              imageUrl={feature.imageUrl}
            />
          ))}
        </div>
      </main>

      <footer className="text-slate-500 text-[1.2rem] mt-12 md:mt-16 mb-6 text-center">
        <p>Ready to supercharge your learning?</p>
        <p className="mt-2">
          <Link href="/pricing" className="text-blue-400 hover:text-blue-300">
            View Pricing Plans
          </Link>{' '}
          or{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Get Started for Free
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
