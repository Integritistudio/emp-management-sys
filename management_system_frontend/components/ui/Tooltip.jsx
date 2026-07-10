"use client";

export function Tooltip({ content, children }) {
  if (!content) return children;

  return (
    <div className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-product transition-opacity duration-150 group-hover/tooltip:opacity-100"
      >
        {content}
      </span>
    </div>
  );
}
