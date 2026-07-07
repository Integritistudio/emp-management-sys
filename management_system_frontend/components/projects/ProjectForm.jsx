"use client";

import { useEffect, useState } from "react";
import { projectsData, PROJECT_QUALITY_OPTIONS, PROJECT_STATUS_OPTIONS } from "@/data/projects";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";

const emptyForm = {
  name: "",
  lead_developer_id: "",
  start_date: "",
  quality: "medium",
  status: "not_started",
};

export function ProjectForm({ project, developers = [], onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || "",
        lead_developer_id: project.lead_developer_id || "",
        start_date: project.start_date
          ? new Date(project.start_date).toISOString().slice(0, 10)
          : "",
        quality: project.quality || "medium",
        status: project.status || "not_started",
      });
    } else {
      setForm(emptyForm);
    }
  }, [project]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        lead_developer_id: form.lead_developer_id || null,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save project");
    } finally {
      setSubmitting(false);
    }
  };

  const developerOptions = developers.map((dev) => ({
    value: dev.id,
    label: dev.full_name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <div className="rounded-button border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <Input
        id="name"
        label={projectsData.form.nameLabel}
        placeholder={projectsData.form.namePlaceholder}
        value={form.name}
        onChange={handleChange("name")}
        required
      />
      <Select
        id="lead_developer_id"
        label={projectsData.form.leadLabel}
        value={form.lead_developer_id}
        onChange={handleChange("lead_developer_id")}
        options={developerOptions}
        placeholder={projectsData.form.leadPlaceholder}
      />
      <Input
        id="start_date"
        type="date"
        label={projectsData.form.startDateLabel}
        value={form.start_date}
        onChange={handleChange("start_date")}
        required
      />
      <Select
        id="quality"
        label={projectsData.form.qualityLabel}
        value={form.quality}
        onChange={handleChange("quality")}
        options={PROJECT_QUALITY_OPTIONS}
      />
      <Select
        id="status"
        label={projectsData.form.statusLabel}
        value={form.status}
        onChange={handleChange("status")}
        options={PROJECT_STATUS_OPTIONS}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {projectsData.form.cancel}
        </Button>
        <Button type="submit" loading={submitting}>
          {projectsData.form.submit}
        </Button>
      </div>
    </form>
  );
}
