"use client";

import * as Popover from "@radix-ui/react-popover";
import { useMemo, useState } from "react";
import { MHT_LAYER } from "@/components/admissions/mht-font";

export type MhtOptions =
  | Readonly<Record<string, readonly string[]>>
  | ReadonlyArray<{ value: string; label: string }>;

interface Option {
  value: string;
  label: string;
}

interface Group {
  label: string | null;
  options: Option[];
}

function toGroups(options: MhtOptions): Group[] {
  if (Array.isArray(options)) return [{ label: null, options: [...options] }];
  return Object.entries(options as Record<string, readonly string[]>).map(([label, values]) => ({
    label,
    options: values.map((value) => ({ value, label: value })),
  }));
}

function GroupBox({
  checked,
  mixed,
  onChange,
  label,
}: {
  checked: boolean;
  mixed: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      className="mht-box"
      aria-label={`All of ${label}`}
      checked={checked}
      ref={(element) => {
        if (element) element.indeterminate = mixed;
      }}
      onChange={onChange}
    />
  );
}

// Searchable checkbox list. Grouped options collapse into a row that selects the whole group.
export function MhtOptionList({
  options,
  selected,
  onChange,
  autoFocus = false,
}: {
  options: MhtOptions;
  selected: readonly string[];
  onChange: (next: string[]) => void;
  autoFocus?: boolean;
}) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const groups = useMemo(() => toGroups(options), [options]);
  const total = groups.reduce((count, group) => count + group.options.length, 0);
  const query = term.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!query) return groups;
    return groups
      .map((group) =>
        group.label?.toLowerCase().includes(query)
          ? group
          : { ...group, options: group.options.filter((option) => option.label.toLowerCase().includes(query)) },
      )
      .filter((group) => group.options.length > 0);
  }, [groups, query]);
  const chosen = new Set(selected);

  function toggle(value: string) {
    onChange(chosen.has(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }

  function toggleGroup(group: Group) {
    const values = group.options.map((option) => option.value);
    const all = values.every((value) => chosen.has(value));
    onChange(all ? selected.filter((item) => !values.includes(item)) : [...new Set([...selected, ...values])]);
  }

  function toggleOpen(label: string) {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <div className="mht-options">
      {total > 8 ? (
        <label className="mht-search mht-options-search">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="4.75" />
            <path d="m10.5 10.5 3 3" />
          </svg>
          <span className="mht-sr">Search options</span>
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search"
            autoComplete="off"
            autoFocus={autoFocus}
          />
        </label>
      ) : null}
      <div className="mht-options-list">
        {visible.map((group) => {
          if (!group.label) {
            return group.options.map((option) => (
              <label key={option.value} className="mht-option">
                <input
                  type="checkbox"
                  className="mht-box"
                  checked={chosen.has(option.value)}
                  onChange={() => toggle(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ));
          }
          const picked = group.options.filter((option) => chosen.has(option.value)).length;
          const expanded = Boolean(query) || open.has(group.label);
          return (
            <div key={group.label} className="mht-option-group">
              <div className="mht-option mht-option-head">
                <GroupBox
                  label={group.label}
                  checked={picked === group.options.length}
                  mixed={picked > 0 && picked < group.options.length}
                  onChange={() => toggleGroup(group)}
                />
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => toggleOpen(group.label!)}
                >
                  <span>{group.label}</span>
                  <span className="mht-option-count">
                    {picked > 0 ? `${picked}/${group.options.length}` : group.options.length}
                  </span>
                </button>
              </div>
              {expanded
                ? group.options.map((option) => (
                    <label key={option.value} className="mht-option mht-option-child">
                      <input
                        type="checkbox"
                        className="mht-box"
                        checked={chosen.has(option.value)}
                        onChange={() => toggle(option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))
                : null}
            </div>
          );
        })}
        {visible.length === 0 ? <p className="mht-options-none">No matches.</p> : null}
      </div>
    </div>
  );
}

// A pill that opens the option list in a popover: "Branch · 3".
export function MhtMultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: MhtOptions;
  selected: readonly string[];
  onChange: (next: string[]) => void;
}) {
  const value =
    selected.length === 0 ? "All" : selected.length === 1 ? selected[0] : `${selected.length} selected`;
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className="mht-pill mht-pill-button mht-pill-wide">
          <span className="mht-pill-label">{label}</span>
          <span className="mht-pill-value" data-empty={selected.length === 0 ? "" : undefined}>
            {value}
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className={`${MHT_LAYER} mht-popover`}
        >
          <MhtOptionList options={options} selected={selected} onChange={onChange} autoFocus />
          {selected.length > 0 ? (
            <div className="mht-popover-foot">
              <span>{selected.length} selected</span>
              <button type="button" className="mht-btn mht-btn-sm mht-btn-ghost" onClick={() => onChange([])}>
                Clear
              </button>
            </div>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
