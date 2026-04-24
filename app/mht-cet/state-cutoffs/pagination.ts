export function getClampedPage(
  page: number,
  perPage: number,
  totalItems: number,
): number {
  const totalPages =
    perPage > 0 ? Math.max(1, Math.ceil(totalItems / perPage)) : 1;
  return Math.min(Math.max(1, page), totalPages);
}
