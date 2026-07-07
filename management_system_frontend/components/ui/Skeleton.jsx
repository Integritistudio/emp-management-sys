export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-border-light ${className}`}
      aria-hidden="true"
    />
  );
}
