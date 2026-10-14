// A labelled select that reads as a chip: "Category  Open ⌄". The native select
// covers the pill, so the platform picker opens on tap and keyboard use is unchanged.
// An option's `short` text shows in the pill when its full label is too long.
export default function MhtPill<T extends string>({
  label,
  value,
  options,
  onChange,
  emptyLabel,
  wide = false,
  attention = false,
  disabled = false,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string; short?: string }>;
  onChange: (value: T) => void;
  emptyLabel?: string;
  wide?: boolean;
  attention?: boolean;
  disabled?: boolean;
}) {
  const current = options.find((option) => option.value === value);
  return (
    <div
      className={wide ? "mht-pill mht-pill-wide" : "mht-pill"}
      data-attention={attention ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
    >
      <span className="mht-pill-label" aria-hidden="true">
        {label}
      </span>
      <span className="mht-pill-value" aria-hidden="true" data-empty={current ? undefined : ""}>
        {current ? (current.short ?? current.label) : (emptyLabel ?? value)}
      </span>
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {emptyLabel !== undefined ? <option value="">{emptyLabel}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
