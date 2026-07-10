export function Table({ children, className = "" }) {
  return (
    <div className={`overflow-x-auto rounded-card border border-border ${className}`}>
      <table className="min-w-full divide-y divide-border-light text-body">{children}</table>
    </div>
  );
}

export function TableHead({ children }) {
  return <thead className="bg-parchment">{children}</thead>;
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-border-light bg-surface">{children}</tbody>;
}

export function TableRow({ children, className = "", onClick, clickable = false }) {
  const isClickable = clickable || Boolean(onClick);

  return (
    <tr
      className={`transition-colors hover:bg-parchment/60 ${
        isClickable ? "cursor-pointer" : ""
      } ${className}`}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({ children, className = "" }) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-left text-caption-strong uppercase tracking-wide text-text-secondary ${className}`}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className = "", ...props }) {
  return (
    <td className={`px-4 py-3 text-text-primary ${className}`} {...props}>
      {children}
    </td>
  );
}
