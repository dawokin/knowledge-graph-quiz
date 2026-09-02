export const CATEGORY_PALETTE = [
  '#5b8def',
  '#f2994a',
  '#27ae60',
  '#bb6bd9',
  '#eb5757',
  '#2d9cdb',
  '#f2c94c',
  '#6fcf97',
  '#9b51e0',
  '#56ccf2',
];

export function colorForCategory(categoryId: string, categoryIds: string[]): string {
  const index = categoryIds.indexOf(categoryId);
  if (index === -1) return '#8a8a8a';
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
}
