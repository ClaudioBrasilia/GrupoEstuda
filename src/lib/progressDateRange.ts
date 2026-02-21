export type ProgressRange = 'day' | 'week' | 'month' | 'year';

export interface DateRange {
  start: Date;
  endExclusive: Date;
}

export const getLocalDayRange = (reference = new Date()): DateRange => {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);

  const endExclusive = new Date(start);
  endExclusive.setDate(endExclusive.getDate() + 1);

  return { start, endExclusive };
};

export const getRangeStart = (timeRange: ProgressRange, reference = new Date()): Date => {
  if (timeRange === 'day') {
    return getLocalDayRange(reference).start;
  }

  const start = new Date(reference);

  if (timeRange === 'week') {
    start.setDate(start.getDate() - 6);
  } else if (timeRange === 'month') {
    start.setDate(start.getDate() - 29);
  } else {
    start.setMonth(start.getMonth() - 11);
    start.setDate(1);
  }

  start.setHours(0, 0, 0, 0);
  return start;
};

export const toLocalDateKey = (value: string | Date): string =>
  new Date(value).toLocaleDateString('en-CA');

export const isInDateRange = (value: string | Date, range: DateRange): boolean => {
  const dateValue = new Date(value);
  return dateValue >= range.start && dateValue < range.endExclusive;
};
