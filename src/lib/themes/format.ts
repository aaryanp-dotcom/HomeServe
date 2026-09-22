/** "0" for none, "12" under a thousand, "4.8k" above — never a rounded-away zero. */
export function formatSaveCount(n: number): string {
  if (n <= 0) return '0'
  if (n < 1000) return String(n)
  return `${(n / 1000).toFixed(1)}k`
}
