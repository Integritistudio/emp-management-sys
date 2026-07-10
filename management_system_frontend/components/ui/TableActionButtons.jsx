"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { commonData } from "@/data/common";

const ACTION_STYLES = {
  view: {
    button:
      "text-primary hover:bg-primary/10 focus-visible:outline-primary",
    icon: "text-primary",
  },
  edit: {
    button:
      "text-accent hover:bg-accent/10 focus-visible:outline-accent",
    icon: "text-accent",
  },
  delete: {
    button: "text-danger hover:bg-danger/10 focus-visible:outline-danger",
    icon: "text-danger",
  },
};

function ActionIconButton({
  type,
  label,
  onClick,
  href,
  disabled = false,
  boxed = false,
}) {
  const Icon = type === "view" ? Eye : type === "edit" ? Pencil : Trash2;
  const styles = ACTION_STYLES[type];
  const className = `inline-flex items-center justify-center rounded-md border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
    boxed ? "h-11 w-11" : "h-9 w-9"
  } ${
    boxed
      ? `border-border bg-surface ${styles.button}`
      : `border-transparent ${styles.button}`
  }`;

  const content = href ? (
    <Link href={href} aria-label={label} className={className}>
      <Icon className={`h-4 w-4 ${styles.icon}`} />
    </Link>
  ) : (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={className}
    >
      <Icon className={`h-4 w-4 ${styles.icon}`} />
    </button>
  );

  return <Tooltip content={label}>{content}</Tooltip>;
}

export function TableActionButtons({
  viewHref,
  onEdit,
  onDelete,
  viewLabel = commonData.actions.view,
  editLabel = commonData.actions.edit,
  deleteLabel = commonData.actions.delete,
  showView = true,
  showEdit = true,
  showDelete = true,
}) {
  return (
    <div
      className="flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {showView && viewHref ? (
        <ActionIconButton type="view" label={viewLabel} href={viewHref} />
      ) : null}

      {showEdit && onEdit ? (
        <ActionIconButton type="edit" label={editLabel} onClick={onEdit} />
      ) : null}

      {showDelete && onDelete ? (
        <ActionIconButton type="delete" label={deleteLabel} onClick={onDelete} />
      ) : null}
    </div>
  );
}

export { ActionIconButton };
