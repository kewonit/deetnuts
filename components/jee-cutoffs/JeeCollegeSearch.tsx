"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Autocomplete } from "@base-ui/react/autocomplete";
import { MHT_LAYER } from "@/components/admissions/mht-font";
import {
  collegeSearchTier,
  prepareCollegeSearch,
} from "@/lib/admissions/college-search";

export interface SearchCollege {
  id: string;
  name: string;
  fullName: string;
  path: string;
  type: string;
  place: string;
  aliases: string[];
}

const LIMIT = 8;

export function JeeCollegeSearch({ colleges }: { colleges: SearchCollege[] }) {
  const [value, setValue] = useState("");
  const field = useRef<HTMLLabelElement>(null);
  const prepared = useMemo(
    () =>
      colleges.map((college) => ({
        college,
        target: prepareCollegeSearch({
          name: college.name,
          code: "",
          extra: [
            college.fullName,
            ...college.aliases,
            college.place,
            college.type,
          ],
        }),
      })),
    [colleges],
  );
  const query = value.trim();
  const matches = useMemo(() => {
    if (!query) return [];
    return prepared
      .map(({ college, target }) => ({
        college,
        tier: collegeSearchTier(target, query),
      }))
      .filter(
        (match): match is { college: SearchCollege; tier: number } =>
          match.tier !== null,
      )
      .sort(
        (a, b) =>
          a.tier - b.tier ||
          a.college.name.localeCompare(b.college.name, "en-IN"),
      )
      .slice(0, LIMIT)
      .map(({ college }) => college);
  }, [prepared, query]);

  return (
    <Autocomplete.Root
      items={colleges}
      filteredItems={matches}
      value={value}
      onValueChange={setValue}
      itemToStringValue={(college: SearchCollege) => college.name}
      autoHighlight
    >
      <label ref={field} className="mht-search mht-search-lg">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="4.75" />
          <path d="m10.5 10.5 3 3" />
        </svg>
        <Autocomplete.Input
          placeholder="Find a college"
          aria-label="Find a college"
          autoComplete="off"
          enterKeyHint="go"
        />
      </label>
      <Autocomplete.Portal>
        <Autocomplete.Positioner
          className={MHT_LAYER}
          anchor={field}
          sideOffset={6}
          align="start"
        >
          <Autocomplete.Popup className="jee-search-popup">
            {/* Empty stays mounted so screen readers hear the change; only its text toggles. */}
            <Autocomplete.Empty>
              {query ? (
                <p className="jee-search-empty">No colleges match.</p>
              ) : null}
            </Autocomplete.Empty>
            <Autocomplete.List className="jee-search-list">
              {(college: SearchCollege) => (
                <Autocomplete.Item
                  key={college.id}
                  value={college}
                  className="jee-search-item"
                  render={<Link href={college.path} />}
                >
                  <span className="mht-dir-logo jee-type" aria-hidden="true">
                    {college.type}
                  </span>
                  <span>
                    <strong>{college.name}</strong>
                    <small>{college.place}</small>
                  </span>
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
