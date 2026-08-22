/**
 * Compares two IDs or objects containing an ID for equality safely.
 */
export const areIdsEqual = (a, b) => {
  if (!a || !b) return false;
  const strA = typeof a === 'object' ? (a._id || a.id) : a;
  const strB = typeof b === 'object' ? (b._id || b.id) : b;
  if (!strA || !strB) return false;
  return String(strA) === String(strB);
};
