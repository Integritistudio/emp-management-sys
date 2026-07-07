export function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface px-6 py-16 text-center">
      <h3 className="text-tagline font-semibold text-text-primary">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-body text-text-secondary">{description}</p>
      ) : null}
    </div>
  );
}
