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

export function TableRow({ children, className = "" }) {
  return <tr className={`transition-colors hover:bg-parchment/60 ${className}`}>{children}</tr>;
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

export function TableCell({ children, className = "" }) {
  return <td className={`px-4 py-3 text-text-primary ${className}`}>{children}</td>;
}
