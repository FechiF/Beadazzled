import { BeadazzledProvider } from '@/src/components/BeadazzledProvider';

export default function layout({ children }: { children: React.ReactNode }) {
  return <BeadazzledProvider>{children}</BeadazzledProvider>;
}
