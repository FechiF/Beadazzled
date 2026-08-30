'use client';

import { useRouter } from 'next/navigation';

import { PlayingScreen } from '@/src/components/screens/PlayingScreen';
import { useBeadazzled } from '@/src/components/BeadazzledProvider';
import { Logo } from '@/src/components/Logo';

export default function PlayPage() {
  const router = useRouter();
  const controller = useBeadazzled();

  const { timeLeft, currentWord, status, pause, resume, restart } = controller;

  const goHome = () => {
    controller.goToScreen('home');
    router.push('/');
  };

  const restartExercise = () => {
    restart();
  };

  return (
    <div className="flex min-h-dvh flex-col bg-linear-to-b from-yellow-50 via-white to-blue-50">
      <header className="flex justify-center px-4 py-5">
        <button type="button" onClick={goHome}>
          <Logo />
        </button>
      </header>

      <PlayingScreen
        timeLeft={timeLeft}
        currentWord={currentWord}
        paused={status === 'paused'}
        onPause={pause}
        onResume={resume}
        onRestart={restartExercise}
        onStop={goHome}
      />
    </div>
  );
}
