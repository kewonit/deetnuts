"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useId, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { deferAfterPress, pressableClass } from "@/lib/pressable";
import { cn } from "@/lib/utils";

interface OptionPickerOption {
  value: string;
  label: string;
  description?: string;
}

interface OptionPickerProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ReadonlyArray<OptionPickerOption>;
  placeholder?: string;
  triggerClassName?: string;
  listClassName?: string;
  id?: string;
}

export function OptionPicker({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  triggerClassName,
  listClassName,
  id: idProp,
}: OptionPickerProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const listboxId = `${id}-listbox`;
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-expanded={open}
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-none border border-input bg-transparent px-2.5 text-sm outline-none",
          pressableClass,
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          triggerClassName,
        )}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder}
        </span>
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
        className="w-(--anchor-width) min-w-(--anchor-width) rounded-none p-1"
        align="start"
      >
        <ul
          id={listboxId}
          className={cn("flex list-none flex-col p-0", listClassName)}
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    deferAfterPress(() => {
                      onValueChange(option.value);
                      setOpen(false);
                    });
                  }}
                  className={cn(
                    "flex w-full flex-col items-start justify-center rounded-none px-2 text-left text-sm outline-none",
                    option.description ? "min-h-11 py-1.5" : "h-8",
                    pressableClass,
                    "hover:bg-muted hover:text-foreground",
                    isSelected ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span>{option.label}</span>
                  {option.description ? (
                    <span className="text-[10px] leading-snug text-muted-foreground">
                      {option.description}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
