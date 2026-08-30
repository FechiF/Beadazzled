'use client';

import { useRouter } from 'next/navigation';

import { BeadazzledFooter } from './BeadazzledFooter';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AboutScreen } from './screens/AboutScreen';
import { InstructionsScreen } from './screens/InstructionsScreen';

import { useBeadazzled } from './BeadazzledProvider';
import { BeadazzledHeader } from './BeadazzledHeader';
import { PlayingScreen } from './screens/PlayingScreen';

export function BeadazzledApp() {
  const router = useRouter();
  const controller = useBeadazzled();

  const {
    screen,
    status,
    settings,
    goToScreen,
    timeLeft,
    currentWord,
    pause,
    resume,
    restart,
    finish,
  } = controller;

  const startExercise = () => {
    goToScreen('play');
    controller.start();
  };

  const stopExercise = () => {
    controller.finish();
    goToScreen('home');
  };

  return (
    <div className="flex min-h-dvh flex-col bg-linear-to-b from-yellow-50 via-white to-blue-50">
      <BeadazzledHeader onLogoClick={() => goToScreen('home')} />
      {screen === 'play' && (
        <PlayingScreen
          timeLeft={timeLeft}
          currentWord={currentWord}
          paused={status === 'paused'}
          onPause={pause}
          onResume={resume}
          onRestart={restart}
          onStop={stopExercise}
        />
      )}
      {screen === 'home' && (
        <HomeScreen settings={settings} onStart={startExercise} />
      )}

      {screen === 'settings' && (
        <SettingsScreen
          voice={settings.voice}
          durationSeconds={settings.durationSeconds}
          intervalMs={settings.intervalMs}
          onVoiceChange={controller.updateVoice}
          onDurationChange={controller.updateDuration}
          onIntervalChange={controller.updateInterval}
        />
      )}

      {screen === 'about' && <AboutScreen />}

      {screen === 'instructions' && <InstructionsScreen />}

      {status !== 'playing' && status !== 'paused' && (
        <BeadazzledFooter currentScreen={screen} onNavigate={goToScreen} />
      )}
    </div>
  );
}
