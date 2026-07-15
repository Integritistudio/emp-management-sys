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
  mode = "single",
  onConfirm,
  onCancel,
  loading,
}) {
  const [step, setStep] = useState("question");
  const [manualHours, setManualHours] = useState("");
  const [hoursError, setHoursError] = useState("");

  useEffect(() => {
    if (open) {
      setStep("question");
      setManualHours("");
      setHoursError("");
    }
  }, [open, task?.id]);

  if (!task) return null;

  const handleClose = () => {
    setStep("question");
    setManualHours("");
    setHoursError("");
    onCancel();
  };

  const handleYes = () => {
    setStep("manual");
    setHoursError("");
    setManualHours("");
  };

  const handleConfirmManual = () => {
    if (manualHours === "" || manualHours === null) {
      setHoursError("Actual hours is required");
      return;
    }
    const hours = parseFloat(manualHours);
    if (Number.isNaN(hours) || hours < 0) {
      setHoursError("Please enter a valid number (0 or greater)");
      return;
    }
    onConfirm({ useManual: true, actualHours: hours });
    setStep("question");
    setManualHours("");
    setHoursError("");
  };

  const handleConfirmElapsed = () => {
    onConfirm({ useManual: false });
    setStep("question");
    setManualHours("");
  };

  const question =
    mode === "bulk"
      ? tasksData.completionModal.messageBulk
      : tasksData.completionModal.message;

  return (
    <Modal open={open} onClose={handleClose} title={tasksData.completionModal.title} size="sm">
      <p className="text-sm text-text-secondary">{question}</p>
      <p className="mt-3 text-sm font-medium text-text-primary">{task.name}</p>

      {elapsedHours !== undefined && elapsedHours !== null ? (
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
            step="any"
            label={tasksData.completionModal.manualActualLabel}
            placeholder={tasksData.completionModal.manualActualPlaceholder}
            value={manualHours}
            onChange={(e) => {
              setManualHours(e.target.value);
              setHoursError("");
            }}
            error={hoursError}
          />
          {mode === "bulk" ? (
            <p className="mt-1.5 text-xs text-text-muted">
              {tasksData.completionModal.bulkManualHint}
            </p>
          ) : null}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setStep("question")} disabled={loading}>
              {tasksData.completionModal.cancel}
            </Button>
            <Button onClick={handleConfirmManual} loading={loading}>
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
