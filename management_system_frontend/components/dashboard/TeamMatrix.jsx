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

/** 9-box heat: better zones trend toward top-right (High Output / High Quality). */
function zoneTone(output, quality) {
  const score = {
    low: 0,
    medium: 1,
    high: 2,
  };
  const value = (score[output] ?? 1) + (score[quality] ?? 1);

  if (value >= 4) return "bg-emerald-50 border-emerald-200";
  if (value === 3) return "bg-teal-50 border-teal-200";
  if (value === 2) return "bg-amber-50/70 border-amber-200";
  return "bg-rose-50/70 border-rose-200";
}

export function TeamMatrix({ matrix, loading, onUpdated }) {
  const [editMember, setEditMember] = useState(null);
  const [outputLevel, setOutputLevel] = useState("medium");
  const [qualityLevel, setQualityLevel] = useState("medium");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const outputLevels =
    matrix?.display_output_levels || ["high", "medium", "low"];
  const qualityLevels =
    matrix?.display_quality_levels || ["low", "medium", "high"];

  const openEdit = (member) => {
    setError("");
    setEditMember(member);
    setOutputLevel(member.output_level || "medium");
    setQualityLevel(member.quality_level || "medium");
  };

  const handleSave = async () => {
    if (!editMember) return;
    setSaving(true);
    setError("");
    try {
      await teamApi.updateMatrixRating(editMember.id, {
        output_level: outputLevel,
        quality_level: qualityLevel,
      });
      setEditMember(null);
      onUpdated?.();
    } catch (err) {
      setError(err.message || "Failed to update rating");
    } finally {
      setSaving(false);
    }
  };

  const findCell = (output, quality) =>
    matrix?.grid?.find(
      (item) =>
        item.output_level === output && item.quality_level === quality
    );

  return (
    <>
      <Card>
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {dashboardData.matrix.title}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {dashboardData.matrix.subtitle}
            </p>
          </div>
          <p className="text-xs text-text-muted">{dashboardData.matrix.hint}</p>
        </div>

        {loading ? (
          <Skeleton className="h-80 rounded-card" />
        ) : (
          <div className="overflow-x-auto">
            <div
              className="grid min-w-[720px] gap-2"
              style={{
                gridTemplateColumns: `112px repeat(${qualityLevels.length}, minmax(0, 1fr))`,
              }}
            >
              <div className="flex items-end justify-center pb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                {dashboardData.matrix.output} ↓ / {dashboardData.matrix.quality} →
              </div>
              {qualityLevels.map((quality) => (
                <div
                  key={quality}
                  className="rounded-lg bg-background px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary"
                >
                  {formatLabel(quality)} {dashboardData.matrix.quality}
                </div>
              ))}

              {outputLevels.map((output) => (
                <div key={output} className="contents">
                  <div className="flex items-center rounded-lg bg-background px-2 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    {formatLabel(output)} {dashboardData.matrix.output}
                  </div>
                  {qualityLevels.map((quality) => {
                    const cell = findCell(output, quality);
                    const members = cell?.members || [];
                    return (
                      <div
                        key={`${output}-${quality}`}
                        className={`min-h-[112px] rounded-xl border p-3 ${zoneTone(
                          output,
                          quality
                        )}`}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-[11px] font-medium text-text-muted">
                            {formatLabel(output)} / {formatLabel(quality)}
                          </p>
                          <span className="rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
                            {members.length} {dashboardData.matrix.members}
                          </span>
                        </div>
                        {members.length === 0 ? (
                          <p className="text-xs text-text-muted">
                            {dashboardData.matrix.emptyCell}
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {members.map((member) => (
                              <button
                                key={member.id}
                                type="button"
                                onClick={() => openEdit(member)}
                                title={`${member.full_name}${
                                  member.title ? ` · ${member.title}` : ""
                                }`}
                                className="rounded-lg border border-white/80 bg-white px-2.5 py-1.5 text-left text-xs font-medium text-text-primary shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
                              >
                                {member.full_name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(editMember)}
        onClose={() => !saving && setEditMember(null)}
        title={dashboardData.matrix.editRating}
        size="sm"
      >
        {editMember ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {editMember.full_name}
              </p>
              {editMember.title ? (
                <p className="text-xs text-text-muted">{editMember.title}</p>
              ) : null}
            </div>
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
            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setEditMember(null)}
                disabled={saving}
              >
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
