"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

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
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((field) => [field.name, field.value])),
  );

  return (
    <form
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      onSubmit={(event) => {
        event.preventDefault();
        const query = new URLSearchParams(window.location.search);
        for (const [name, value] of Object.entries(values)) query.set(name, value);
        const hash = window.location.hash;
        router.replace(`${pathname}?${query.toString()}${hash}`, { scroll: false });
      }}
    >
      {fields.map((field) => (
        <label key={field.name} className="text-sm font-semibold text-slate-700">
          <span className="mb-1.5 block">{field.label}</span>
          <select
            name={field.name}
            value={values[field.name]}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                [field.name]: event.target.value,
              }))
            }
            className="min-h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <button
        type="submit"
        className="min-h-11 self-end border border-slate-950 bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
      >
        Update cutoffs
      </button>
    </form>
  );
}
