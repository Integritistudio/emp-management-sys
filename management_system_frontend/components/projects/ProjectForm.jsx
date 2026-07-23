"use client";

import { useEffect, useState } from "react";
import { projectsData, PROJECT_QUALITY_OPTIONS, PROJECT_STATUS_OPTIONS } from "@/data/projects";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { hasErrors, required } from "@/lib/formValidation";

const emptyForm = {
  name: "",
  lead_developer_id: "",
  start_date: "",
  quality: "medium",
  status: "not_started",
  locked_hours: "",
};

export function ProjectForm({ project, developers = [], onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

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
        locked_hours:
          project.locked_hours !== null && project.locked_hours !== undefined
            ? String(project.locked_hours)
            : "",
      });
    } else {
      setForm(emptyForm);
    }
    setFieldErrors({});
    setError("");
  }, [project]);

  const handleChange = (field) => (e) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validate = () => {
    const errors = {
      name: required(form.name, "Project name is required"),
      start_date: required(form.start_date, "Start date is required"),
    };
    if (form.locked_hours !== "" && Number(form.locked_hours) < 0) {
      errors.locked_hours = "Locked hours must be 0 or greater";
    }
    setFieldErrors(errors);
    return !hasErrors(errors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        lead_developer_id: form.lead_developer_id || null,
        locked_hours:
          form.locked_hours === "" ? null : Number(form.locked_hours),
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
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
        error={fieldErrors.name}
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
        error={fieldErrors.start_date}
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
      <Input
        id="locked_hours"
        type="number"
        min="0"
        step="0.01"
        label={projectsData.form.lockedHoursLabel}
        placeholder={projectsData.form.lockedHoursPlaceholder}
        value={form.locked_hours}
        onChange={handleChange("locked_hours")}
        error={fieldErrors.locked_hours}
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
