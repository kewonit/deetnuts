// A labelled select that reads as a chip: "Category  Open ⌄". The native select
// covers the pill, so the platform picker opens on tap and keyboard use is unchanged.
export default function MhtPill<T extends string>({
  label,
  value,
  options,
  onChange,
  emptyLabel,
  wide = false,
  attention = false,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  emptyLabel?: string;
  wide?: boolean;
  attention?: boolean;
}) {
  const current = options.find((option) => option.value === value)?.label;
  return (
    <div
      className={wide ? "mht-pill mht-pill-wide" : "mht-pill"}
      data-attention={attention ? "" : undefined}
    >
      <span className="mht-pill-label" aria-hidden="true">
        {label}
      </span>
      <span className="mht-pill-value" aria-hidden="true">
        {current ?? emptyLabel ?? value}
      </span>
      <select
        aria-label={label}
        value={value}
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
