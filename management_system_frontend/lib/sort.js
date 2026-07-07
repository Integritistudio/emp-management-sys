export function getNextSort(currentSort, column) {
  const [col, dir] = (currentSort || "").split(":");
  if (col !== column) return `${column}:asc`;
  if (dir === "asc") return `${column}:desc`;
  return null;
}
