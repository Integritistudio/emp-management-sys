"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";
import { commonData } from "@/data/common";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = commonData.confirm.delete,
  cancelLabel = commonData.confirm.cancel,
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-body text-text-secondary">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === "danger" ? "danger" : "primary"}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
