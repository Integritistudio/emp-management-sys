export function Input({
  label,
  id,
  error,
  className = "",
  ...props
}) {
  const borderClass = error
    ? "border-danger focus:border-danger focus:outline-danger"
    : "border-border focus:border-primary focus:outline-primary-focus";

  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={id}
          className="mb-2 block text-caption-strong text-text-primary"
        >
          {label}
        </label>
      ) : null}
      <input
        id={id}
        {...props}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-11 w-full rounded-md border bg-surface px-4 text-body text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:outline-2 focus:outline-offset-0 ${borderClass} ${className}`}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-caption text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
