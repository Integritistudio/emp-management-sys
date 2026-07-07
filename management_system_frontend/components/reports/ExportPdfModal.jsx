"use client";

import { useState } from "react";
import { reportsData } from "@/data/reports";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

export function ExportPdfModal({ open, onClose, onExport, type }) {
  const [period, setPeriod] = useState("week");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await onExport({
        period,
        startDate: period === "custom" ? startDate : undefined,
        endDate: period === "custom" ? endDate : undefined,
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
        <Select
          id="exportPeriod"
          label={reportsData.filters.period}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          options={[
            { value: "week", label: reportsData.filters.week },
            { value: "month", label: reportsData.filters.month },
            { value: "custom", label: reportsData.filters.custom },
          ]}
        />

        {period === "custom" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                {reportsData.filters.startDate}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-button border border-border bg-surface px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                {reportsData.filters.endDate}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-button border border-border bg-surface px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {reportsData.export.cancel}
          </Button>
          <Button onClick={handleExport} loading={loading}>
            {reportsData.export.submit}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
