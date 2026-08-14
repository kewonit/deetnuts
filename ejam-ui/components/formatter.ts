const LOCALE = "en-US";

const INTEGER_FORMATTER = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 0,
});

/** Whole numbers with grouping (visits, sessions, counts). */
export function formatInteger(value: number) {
  return INTEGER_FORMATTER.format(value);
}
