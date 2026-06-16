/** Uppercase text for data entry (names, addresses, grades, etc.) */
export function upper(value: string): string {
  return value.toUpperCase();
}

/** Uppercase string values; pass through numbers and other types unchanged */
export function upperValue<T>(value: T): T {
  return (typeof value === 'string' ? value.toUpperCase() : value) as T;
}
