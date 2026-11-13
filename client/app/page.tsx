'use client';

import { useEffect } from 'react';
import AuthForm from '@/components/AuthForm';
import GameApp from '@/components/GameApp';
import { useAuth } from '@/store/authStore';

export default function Home() {
  const status = useAuth((s) => s.status);
  const fetchMe = useAuth((s) => s.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (status === 'loading') {
    return <main className="p-8 text-gray-500">확인하는 중...</main>;
  }

  if (status === 'anon') {
    return (
      <main className="mx-auto max-w-md p-6">
        <AuthForm />
      </main>
    );
  }

  return <GameApp />;
}
