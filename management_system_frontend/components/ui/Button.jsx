export function Button({
  children,
  type = "button",
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
  onClick,
  ...props
}) {
  const base =
    "inline-flex min-h-[44px] items-center justify-center gap-2 px-[22px] py-[11px] text-body font-normal transition-all duration-200 focus:outline-none focus:outline-2 focus:outline-offset-2 focus:outline-primary-focus active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";

  const variants = {
    primary: "rounded-pill bg-primary text-white hover:bg-primary-hover",
    secondary:
      "rounded-pill border border-primary bg-transparent text-primary hover:bg-primary/5",
    ghost:
      "rounded-md bg-surface-pearl px-4 py-2 text-caption text-text-secondary hover:bg-parchment hover:text-text-primary",
    danger: "rounded-pill bg-danger text-white hover:bg-red-700",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? <ButtonLoader variant={variant} /> : null}
      {children}
    </button>
  );
}

export function ButtonLoader({ variant = "primary" }) {
  const spinnerClass =
    variant === "primary" || variant === "danger"
      ? "border-white/30 border-t-white"
      : "border-primary/30 border-t-primary";

  return (
    <span
      className={`h-4 w-4 animate-spin rounded-full border-2 ${spinnerClass}`}
    />
  );
}
