import { Search } from "lucide-react";

export function SearchInput({ value, onChange, placeholder, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-11 w-full rounded-pill border border-border bg-surface py-2 pl-11 pr-4 text-body text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:outline-2 focus:outline-offset-0 focus:outline-primary-focus"
      />
    </div>
  );
}
