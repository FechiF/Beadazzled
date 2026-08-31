'use client';

import type { AppScreen } from '@/src/hooks/useExerciseController';

interface BeadazzledFooterProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

type FooterButtonType = {
  label: string;
  screen: AppScreen;
};

export function BeadazzledFooter(props: BeadazzledFooterProps) {
  const { currentScreen } = props;
  const items: Array<FooterButtonType> = [
    {
      label: 'Settings',
      screen: 'settings',
    },
    {
      label: 'About',
      screen: 'about',
    },
    {
      label: 'Instructions',
      screen: 'instructions',
    },
  ];

  return (
    <footer className="mt-auto flex flex-wrap justify-center gap-3 px-4 py-5">
      {currentScreen === 'home' ? (
        items.map((item, i) => <FooterButton key={i} item={item} {...props} />)
      ) : currentScreen === 'settings' ? (
        <FooterButton item={{ label: 'Save', screen: 'home' }} {...props} />
      ) : (
        <FooterButton item={{ label: 'Ok', screen: 'home' }} {...props} />
      )}
    </footer>
  );
}

function FooterButton({
  item,
  currentScreen,
  onNavigate,
}: {
  item: FooterButtonType;
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}) {
  return (
    <button
      key={item.screen}
      type="button"
      onClick={() => onNavigate(item.screen)}
      className={[
        'rounded-full px-5 py-3',
        'font-bold',
        'transition',
        'active:scale-95',
        currentScreen === 'settings'
          ? 'bg-green-500 text-white'
          : currentScreen === 'home'
            ? 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200'
            : 'bg-blue-500 text-white',
      ].join(' ')}
    >
      {item.label}
    </button>
  );
}
