const dayMs = 24 * 60 * 60 * 1000;

export function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function daysBetween(start: string, end: string): number {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  return Math.max(0, Math.ceil((endDate.getTime() - startDate.getTime()) / dayMs));
}

export function inclusiveDaysBetween(start: string, end: string): number {
  return daysBetween(start, end) + 1;
}

export function formatTenure(totalDays: number): string {
  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays % 365) / 30);
  const days = (totalDays % 365) % 30;
  return `${years}년 ${months}개월 ${days}일`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
