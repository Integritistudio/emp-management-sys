export function Input({
  label,
  id,
  error,
  className = "",
  ...props
}) {
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
        className={`h-11 w-full rounded-md border border-border bg-surface px-4 text-body text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:outline-2 focus:outline-offset-0 focus:outline-primary-focus ${error ? "border-danger" : ""} ${className}`}
        {...props}
      />
      {error ? <p className="mt-1.5 text-caption text-danger">{error}</p> : null}
    </div>
  );
}
