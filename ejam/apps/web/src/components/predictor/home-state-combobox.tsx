"use client";

import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from "lucide-react";
import { useId, useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HOME_STATES, isHomeState } from "@/lib/home-states";
import { deferAfterPress, pressableClass } from "@/lib/pressable";
import { cn } from "@/lib/utils";

interface HomeStateComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function HomeStateCombobox({
  value,
  onValueChange,
  placeholder = "Select home state",
  className,
  id: idProp,
}: HomeStateComboboxProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const listboxId = `${id}-listbox`;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredStates = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return HOME_STATES;
    return HOME_STATES.filter((state) => state.toLowerCase().includes(query));
  }, [search]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSearch("");
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-expanded={open}
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-none border border-input px-2.5 text-sm outline-none",
          "transition-colors duration-200 ease-out bg-transparent shadow-none hover:bg-muted dark:bg-transparent dark:hover:bg-muted/50",
          pressableClass,
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          className,
        )}
      >
        {value && isHomeState(value) ? (
          <span className="truncate">{value}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <span
          className="t-icon-swap shrink-0 text-muted-foreground/80"
          data-state={open ? "b" : "a"}
          aria-hidden
        >
          <ChevronDownIcon className="t-icon size-4" data-icon="a" />
          <ChevronUpIcon className="t-icon size-4" data-icon="b" />
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--anchor-width) min-w-(--anchor-width) rounded-none p-0"
        align="start"
      >
        <div className="flex items-center border-b border-border px-3">
          <SearchIcon className="mr-2 size-4 shrink-0 opacity-50" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search state…"
            aria-label="Search states"
            className="flex h-9 w-full bg-transparent py-3 text-sm outline-none"
          />
        </div>
        <ul
          id={listboxId}
          className="no-scrollbar max-h-60 list-none overflow-y-auto p-1"
        >
          {filteredStates.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No state found.
            </p>
          ) : (
            filteredStates.map((stateName) => {
              const isSelected = value === stateName;

              return (
                <li key={stateName}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      deferAfterPress(() => {
                        onValueChange(stateName === value ? "" : stateName);
                        setOpen(false);
                      });
                    }}
                    className={cn(
                      "flex h-8 w-full items-center rounded-none px-2 text-left text-sm outline-none",
                      pressableClass,
                      "hover:bg-muted hover:text-foreground",
                      isSelected ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <span className="truncate">{stateName}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
