// Month mapping for consistent display
export const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre'
];

export const MONTH_ABBREVIATIONS = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Jun',
  'Jul',
  'Aoû',
  'Sep',
  'Oct',
  'Nov',
  'Déc'
];

export function getMonthAbbreviation(fullMonth: string): string {
  const index = MONTHS.indexOf(fullMonth);
  return index >= 0 ? MONTH_ABBREVIATIONS[index] : fullMonth;
}

export function sortByMonth(a: { month: string }, b: { month: string }): number {
  return MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month);
}

export function transformMonthlyData<T extends { month: string }>(data: T[]): T[] {
  return [...data].sort(sortByMonth);
}
