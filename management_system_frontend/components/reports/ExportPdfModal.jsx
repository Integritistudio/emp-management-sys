"use client";

import { useEffect, useState } from "react";
import { reportsData } from "@/data/reports";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { hasErrors, required } from "@/lib/formValidation";

function toInputDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function defaultWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { startDate: toInputDate(start), endDate: toInputDate(end) };
}

export function ExportPdfModal({ open, onClose, onExport, type }) {
  const defaults = defaultWeekRange();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const range = defaultWeekRange();
      setStartDate(range.startDate);
      setEndDate(range.endDate);
      setFieldErrors({});
    }
  }, [open]);

  const handleExport = async () => {
    const errors = {
      startDate: required(startDate, "Start date is required"),
      endDate: required(endDate, "End date is required"),
    };
    if (
      !errors.startDate &&
      !errors.endDate &&
      new Date(startDate) > new Date(endDate)
    ) {
      errors.endDate = "End date must be on or after start date";
    }
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setLoading(true);
    try {
      await onExport({
        period: "custom",
        startDate,
        endDate,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={reportsData.export.title} size="sm">
      <p className="mb-4 text-sm text-text-secondary">
        {reportsData.export.description}
      </p>
      <p className="mb-4 text-sm font-medium text-text-primary">
        {type === "team" ? reportsData.tabs.team : reportsData.tabs.project}
      </p>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="exportStartDate"
            type="date"
            label={reportsData.export.startDate}
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setFieldErrors((prev) => {
                if (!prev.startDate) return prev;
                const next = { ...prev };
                delete next.startDate;
                return next;
              });
            }}
            error={fieldErrors.startDate}
          />
          <Input
            id="exportEndDate"
            type="date"
            label={reportsData.export.endDate}
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setFieldErrors((prev) => {
                if (!prev.endDate) return prev;
                const next = { ...prev };
                delete next.endDate;
                return next;
              });
            }}
            error={fieldErrors.endDate}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {reportsData.export.cancel}
          </Button>
          <Button onClick={handleExport} loading={loading}>
            {reportsData.export.confirm}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
