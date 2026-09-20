"use client";

import { usePathname, useRouter } from "next/navigation";
import { OptionPicker } from "@ejam/ui/components/predictor/option-picker";

interface SelectOption {
  value: string;
  label: string;
}

interface FilterField {
  name: string;
  label: string;
  value: string;
  options: SelectOption[];
}

export default function AdmissionsFilters({ fields }: { fields: FilterField[] }) {
  const pathname = usePathname();
  const router = useRouter();

  function apply(name: string, value: string) {
    const query = new URLSearchParams(window.location.search);
    query.set(name, value);
    const hash = window.location.hash;
    router.replace(`${pathname}?${query.toString()}${hash}`, { scroll: false });
  }

  return (
    <div className="cutoff-controls-chips">
      {fields.map((field) => (
        <label className="cutoff-field" key={field.name}>
          <span>{field.label}</span>
          <OptionPicker
            id={`admissions-${field.name}`}
            value={field.value}
            options={field.options}
            onValueChange={(value) => apply(field.name, value)}
          />
        </label>
      ))}
    </div>
  );
}
