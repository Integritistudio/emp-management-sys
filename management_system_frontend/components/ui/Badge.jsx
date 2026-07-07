export function Badge({ children, variant = "default" }) {
  const variants = {
    default: "bg-parchment text-text-secondary",
    primary: "bg-primary/10 text-primary",
    success: "bg-green-50 text-success",
    warning: "bg-amber-50 text-warning",
    danger: "bg-red-50 text-danger",
  };

  return (
    <span
      className={`inline-flex items-center rounded-pill px-3 py-1 text-caption font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
