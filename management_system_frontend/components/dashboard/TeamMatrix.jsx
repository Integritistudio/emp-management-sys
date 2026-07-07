"use client";

import { useState } from "react";
import { dashboardData, MATRIX_LEVEL_OPTIONS } from "@/data/dashboard";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { teamApi } from "@/lib/team";
import { formatLabel } from "@/lib/formatters";

export function TeamMatrix({ matrix, loading, onUpdated }) {
  const [editMember, setEditMember] = useState(null);
  const [outputLevel, setOutputLevel] = useState("medium");
  const [qualityLevel, setQualityLevel] = useState("medium");
  const [saving, setSaving] = useState(false);

  const openEdit = (member) => {
    setEditMember(member);
    setOutputLevel(member.output_level || "medium");
    setQualityLevel(member.quality_level || "medium");
  };

  const handleSave = async () => {
    if (!editMember) return;
    setSaving(true);
    try {
      await teamApi.updateMatrixRating(editMember.id, {
        output_level: outputLevel,
        quality_level: qualityLevel,
      });
      setEditMember(null);
      onUpdated?.();
    } finally {
      setSaving(false);
    }
  };

  const levels = matrix?.levels || ["low", "medium", "high"];

  return (
    <>
      <Card>
        <h2 className="text-lg font-semibold text-text-primary">
          {dashboardData.matrix.title}
        </h2>
        <p className="mb-4 text-sm text-text-secondary">
          {dashboardData.matrix.subtitle}
        </p>

        {loading ? (
          <Skeleton className="h-64 rounded-card" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left text-xs font-semibold uppercase text-text-muted">
                    {dashboardData.matrix.output} \ {dashboardData.matrix.quality}
                  </th>
                  {levels.map((level) => (
                    <th
                      key={level}
                      className="p-2 text-center text-xs font-semibold uppercase text-text-muted"
                    >
                      {formatLabel(level)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {levels.map((output) => (
                  <tr key={output}>
                    <td className="p-2 text-xs font-semibold uppercase text-text-secondary">
                      {formatLabel(output)}
                    </td>
                    {levels.map((quality) => {
                      const cell = matrix?.grid?.find(
                        (item) =>
                          item.output_level === output &&
                          item.quality_level === quality
                      );
                      return (
                        <td
                          key={`${output}-${quality}`}
                          className="border border-border-light p-2 align-top"
                        >
                          <p className="mb-2 text-xs font-medium text-text-muted">
                            {cell?.count || 0} {dashboardData.matrix.members}
                          </p>
                          <div className="space-y-1">
                            {cell?.members?.map((member) => (
                              <button
                                key={member.id}
                                type="button"
                                onClick={() =>
                                  openEdit({
                                    ...member,
                                    output_level: output,
                                    quality_level: quality,
                                  })
                                }
                                className="block w-full rounded-button bg-background px-2 py-1 text-left text-xs text-text-primary hover:bg-sidebar-active"
                              >
                                {member.full_name}
                              </button>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(editMember)}
        onClose={() => setEditMember(null)}
        title={dashboardData.matrix.editRating}
        size="sm"
      >
        {editMember ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-text-primary">
              {editMember.full_name}
            </p>
            <Select
              id="outputLevel"
              label={dashboardData.matrix.outputLabel}
              value={outputLevel}
              onChange={(e) => setOutputLevel(e.target.value)}
              options={MATRIX_LEVEL_OPTIONS}
            />
            <Select
              id="qualityLevel"
              label={dashboardData.matrix.qualityLabel}
              value={qualityLevel}
              onChange={(e) => setQualityLevel(e.target.value)}
              options={MATRIX_LEVEL_OPTIONS}
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setEditMember(null)}>
                {dashboardData.matrix.cancel}
              </Button>
              <Button onClick={handleSave} loading={saving}>
                {dashboardData.matrix.save}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
