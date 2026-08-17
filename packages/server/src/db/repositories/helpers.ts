export function requireOne<T>(rows: T[], id: string): T {
  const row = rows[0];
  if (!row) throw new Error(`record not found: ${id}`);
  return row;
}
