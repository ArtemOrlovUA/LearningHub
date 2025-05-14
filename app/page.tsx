import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>LearningHub</h1>
      <p>
        Welcome to LearningHub, your ultimate destination for all things learning. Whether
        you&apos;re a student, a professional, or just someone who loves to learn, you&apos;ve come
        to the right place.
      </p>
      <Link href="/login">Login</Link>
    </div>
  );
}
