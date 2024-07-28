// app/mht-cet/all-india-cutoffs/components/round-selector.tsx
'use client';

import { useRouter } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select'
interface RoundSelectorProps {
  round: string;
  year: number;
}

export default function RoundSelector({ round, year }: RoundSelectorProps) {
  const router = useRouter();

  const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRound = e.target.value;
    router.push(`/mht-cet/all-state-cutoffs/${year}/${selectedRound}`);
  };

  return (
    <select value={round} onChange={handleRoundChange}>
      <option value="round-one">Round One</option>
      <option value="round-two">Round Two</option>
      <option value="round-three">Round Three</option>
    </select>
  );
}
