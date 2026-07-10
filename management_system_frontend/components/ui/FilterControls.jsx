import { Search } from "lucide-react";

/** Filter keys that need extra width for long names (developers, projects). */
export const WIDE_FILTER_KEYS = new Set([
  "leadDeveloperId",
  "developerId",
  "projectId",
]);

export function getFilterFieldClass(key) {
  return WIDE_FILTER_KEYS.has(key) ? "filter-field-wide" : "filter-field";
}

export function FilterLabel({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="filter-label">
      {children}
    </label>
  );
}

export function FilterSelect({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = "All",
  fieldClassName = "filter-field",
}) {
  return (
    <div className={fieldClassName}>
      {label ? <FilterLabel htmlFor={id}>{label}</FilterLabel> : null}
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="filter-select"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FilterDate({ id, label, value, onChange, fieldClassName = "filter-field" }) {
  return (
    <div className={fieldClassName}>
      <FilterLabel htmlFor={id}>{label}</FilterLabel>
      <input
        id={id}
        type="date"
        value={value}
        onChange={onChange}
        className="filter-date"
      />
    </div>
  );
}

export function FilterSearch({ value, onChange, placeholder, className = "" }) {
  return (
    <div className={`filter-search-wrap ${className}`.trim()}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="filter-search-input"
        />
      </div>
    </div>
  );
}

export function FilterClearButton({ visible, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm font-medium text-primary hover:text-primary-hover ${
        visible ? "visible" : "invisible pointer-events-none"
      }`}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      Clear filters
    </button>
  );
}
