export function Select({ label, id, error, options = [], placeholder, className = "", ...props }) {
  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={id} className="mb-2 block text-caption-strong text-text-primary">
          {label}
        </label>
      ) : null}
      <select
        id={id}
        className={`h-11 w-full rounded-md border border-border bg-surface px-4 text-body text-text-primary focus:border-primary focus:outline-none focus:outline-2 focus:outline-offset-0 focus:outline-primary-focus ${error ? "border-danger" : ""} ${className}`}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1.5 text-caption text-danger">{error}</p> : null}
    </div>
  );
}
