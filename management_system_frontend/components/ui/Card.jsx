export function Card({ children, className = "", padding = true }) {
  return (
    <div
      className={`rounded-card border border-border bg-surface ${padding ? "p-6" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
