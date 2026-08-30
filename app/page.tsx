import { BeadazzledApp } from '@/src/components/BeadazzledApp';
import { BeadazzledProvider } from '@/src/components/BeadazzledProvider';

export default function HomePage() {
  return (
    <BeadazzledProvider>
      <BeadazzledApp />
    </BeadazzledProvider>
  );
}
