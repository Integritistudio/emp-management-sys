export function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-parchment text-text-secondary",
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border border-amber-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
    // Attention flags — each alert gets a distinct hue
    alertNearDeadline: "bg-amber-50 text-amber-800 border border-amber-300",
    alertOverdue: "bg-red-50 text-red-700 border border-red-300",
    alertDelayed: "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-300",
    alertPaused: "bg-sky-50 text-sky-700 border border-sky-300",
    alertOnHold: "bg-violet-50 text-violet-700 border border-violet-300",
    alertHighVariance: "bg-orange-50 text-orange-700 border border-orange-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-pill px-3 py-1 text-caption font-medium ${variants[variant] || variants.default} ${className}`}
    >
      {children}
    </span>
  );
}
