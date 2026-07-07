"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { tasksData } from "@/data/tasks";
import { formatHours } from "@/lib/formatters";

export function CompletionModal({
  open,
  task,
  elapsedHours,
  onConfirm,
  onCancel,
  loading,
}) {
  const [step, setStep] = useState("question");
  const [manualHours, setManualHours] = useState("");

  useEffect(() => {
    if (open) {
      setStep("question");
      setManualHours("");
    }
  }, [open, task?.id]);

  if (!task) return null;

  const handleClose = () => {
    setStep("question");
    setManualHours("");
    onCancel();
  };

  const handleYes = () => {
    setStep("manual");
    if (elapsedHours !== undefined && elapsedHours !== null) {
      setManualHours(String(elapsedHours));
    }
  };

  const handleConfirmManual = () => {
    onConfirm({ useManual: true, actualHours: parseFloat(manualHours) });
    setStep("question");
    setManualHours("");
  };

  const handleConfirmElapsed = () => {
    onConfirm({ useManual: false });
    setStep("question");
    setManualHours("");
  };

  return (
    <Modal open={open} onClose={handleClose} title={tasksData.completionModal.title} size="sm">
      <p className="text-sm text-text-secondary">{tasksData.completionModal.message}</p>
      <p className="mt-3 text-sm font-medium text-text-primary">{task.name}</p>

      {elapsedHours !== undefined ? (
        <p className="mt-2 text-sm text-text-secondary">
          {tasksData.completionModal.elapsed}:{" "}
          <span className="font-semibold text-text-primary">
            {formatHours(elapsedHours)} {tasksData.completionModal.hours}
          </span>
        </p>
      ) : null}

      {step === "manual" ? (
        <div className="mt-4">
          <Input
            id="manual_actual_hours"
            type="number"
            min="0"
            step="0.1"
            label={tasksData.completionModal.manualActualLabel}
            placeholder={tasksData.completionModal.manualActualPlaceholder}
            value={manualHours}
            onChange={(e) => setManualHours(e.target.value)}
            required
          />
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setStep("question")} disabled={loading}>
              {tasksData.completionModal.cancel}
            </Button>
            <Button
              onClick={handleConfirmManual}
              loading={loading}
              disabled={!manualHours || parseFloat(manualHours) < 0}
            >
              {tasksData.completionModal.confirm}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            {tasksData.completionModal.cancel}
          </Button>
          <Button variant="secondary" onClick={handleConfirmElapsed} loading={loading}>
            {tasksData.completionModal.no}
          </Button>
          <Button onClick={handleYes} disabled={loading}>
            {tasksData.completionModal.yes}
          </Button>
        </div>
      )}
    </Modal>
  );
}
