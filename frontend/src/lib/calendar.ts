/** Month-grid helpers shared by the Events calendar and the Skill Exchange date picker. */

export type CalendarMonth = { year: number; month: number }; // month is 0-11

export const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** "YYYY-MM-DD" for a day in a calendar month. */
export function dayKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function shiftMonth({ year, month }: CalendarMonth, delta: number): CalendarMonth {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

/** Day numbers for a month laid out Sun-Sat, padded with nulls, split into weeks. */
export function monthWeeks({ year, month }: CalendarMonth): (number | null)[][] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}
