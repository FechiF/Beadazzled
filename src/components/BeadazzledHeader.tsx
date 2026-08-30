'use client';

import { Logo } from './Logo';

interface BeadazzledHeaderProps {
  onLogoClick: () => void;
}

export function BeadazzledHeader({ onLogoClick }: BeadazzledHeaderProps) {
  return (
    <button type="button" onClick={onLogoClick} aria-label="Go to home">
      <Logo />
    </button>
  );
}
