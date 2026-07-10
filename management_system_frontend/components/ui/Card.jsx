export function Card({ children, className = "", padding = true, ...props }) {
  return (
    <div
      className={`rounded-card border border-border bg-surface ${padding ? "p-6" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
