"use client";

import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SelectorProps {
  type: 'year' | 'round';
  value: string | number;
  year?: number;
  round?: string;
}

export default function Selector({ type, value, year = 2023, round = 'round-one' }: SelectorProps) {
  const router = useRouter();

  const handleChange = (selectedValue: string) => {
    router.push(`/mht-cet/all-india-cutoffs/${type === 'year' ? selectedValue : year}/${type === 'round' ? selectedValue : round}`);
  };

  const options = type === 'year' ? ['2023'] : ['round-one'];

  return (
    <Select value={value.toString()} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px] mt-10 sm:mt-0">
        <SelectValue placeholder={value.toString()} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{type === 'year' ? 'Choose Year' : 'Choose Round'}</SelectLabel>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}