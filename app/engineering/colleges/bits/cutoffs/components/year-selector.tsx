// app/mht-cet/all-india-cutoffs/components/year-selector.tsx
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
} from '@/components/ui/select';

interface YearSelectorProps {
  year: number;
}

export default function YearSelector({ year }: YearSelectorProps) {
  const router = useRouter();

  const handleYearChange = (selectedYear: string) => {
    router.push(`/mht-cet/all-india-cutoffs/${selectedYear}/round-one`);
  };

  return (
    <Select onValueChange={handleYearChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={year.toString()} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Year</SelectLabel>
          <SelectItem value="2023">2023</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
