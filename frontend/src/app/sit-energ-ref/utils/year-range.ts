export function getYearRange(offset: number = 5): number[] {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - offset;
  const endYear = currentYear + offset;
  
  return Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  );
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
} 