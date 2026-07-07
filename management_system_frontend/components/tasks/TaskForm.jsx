"use client";

import { useEffect, useState } from "react";
import {
  tasksData,
  TASK_COMPLEXITY_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "@/data/tasks";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/formatters";

// PDF 11.1: a task created with the current time defaults to In Progress,
// so the initial form state (checkbox on) starts as in_progress.
const emptyForm = {
  name: "",
  project_id: "",
  details: "",
  complexity: "medium",
  priority: "medium",
  assigned_to: "",
  start_time: "",
  deadline: "",
  estimated_hours: "",
  actual_hours: "",
  status: "in_progress",
  use_current_time: true,
};

export function TaskForm({
  task,
  projects = [],
  developers = [],
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (task) {
      setForm({
        name: task.name || "",
        project_id: task.project_id || "",
        details: task.details || "",
        complexity: task.complexity || "medium",
        priority: task.priority || "medium",
        assigned_to: task.assigned_to || "",
        start_time: task.start_time ? toDatetimeLocalValue(task.start_time) : "",
        deadline: task.deadline ? toDatetimeLocalValue(task.deadline) : "",
        estimated_hours: task.estimated_hours?.toString() || "",
        actual_hours: task.actual_hours?.toString() || "",
        status: task.status || "not_started",
        use_current_time: false,
      });
    } else {
      setForm(emptyForm);
    }
  }, [task]);

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // PDF 11.1: starting with the current time marks the task In Progress.
      if (field === "use_current_time" && !task) {
        next.status = value ? "in_progress" : "not_started";
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        project_id: form.project_id,
        details: form.details || null,
        complexity: form.complexity,
        priority: form.priority,
        assigned_to: form.assigned_to || null,
        estimated_hours: parseFloat(form.estimated_hours),
        status: form.status,
      };

      if (task && form.actual_hours !== "") {
        payload.actual_hours = parseFloat(form.actual_hours);
      }

      if (task) {
        if (form.start_time) {
          payload.start_time = fromDatetimeLocalValue(form.start_time);
        }
        if (form.deadline) {
          payload.deadline = fromDatetimeLocalValue(form.deadline);
        }
      } else if (form.use_current_time) {
        payload.use_current_time = true;
      } else if (form.start_time) {
        payload.start_time = fromDatetimeLocalValue(form.start_time);
        payload.use_current_time = false;
      }

      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save task");
    } finally {
      setSubmitting(false);
    }
  };

  const projectOptions = projects.map((project) => ({
    value: project.id,
    label: project.name,
  }));

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
        label={tasksData.form.nameLabel}
        placeholder={tasksData.form.namePlaceholder}
        value={form.name}
        onChange={handleChange("name")}
        required
      />
      <Select
        id="project_id"
        label={tasksData.form.projectLabel}
        value={form.project_id}
        onChange={handleChange("project_id")}
        options={projectOptions}
        placeholder={tasksData.form.projectPlaceholder}
        required
      />
      <div>
        <label
          htmlFor="details"
          className="mb-1.5 block text-sm font-medium text-text-primary"
        >
          {tasksData.form.detailsLabel}
        </label>
        <textarea
          id="details"
          rows={3}
          placeholder={tasksData.form.detailsPlaceholder}
          value={form.details}
          onChange={handleChange("details")}
          className="w-full rounded-button border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          id="complexity"
          label={tasksData.form.complexityLabel}
          value={form.complexity}
          onChange={handleChange("complexity")}
          options={TASK_COMPLEXITY_OPTIONS}
        />
        <Select
          id="priority"
          label={tasksData.form.priorityLabel}
          value={form.priority}
          onChange={handleChange("priority")}
          options={TASK_PRIORITY_OPTIONS}
        />
      </div>
      <Select
        id="assigned_to"
        label={tasksData.form.assigneeLabel}
        value={form.assigned_to}
        onChange={handleChange("assigned_to")}
        options={developerOptions}
        placeholder={tasksData.form.assigneePlaceholder}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="estimated_hours"
          type="number"
          min="0.1"
          step="0.1"
          label={tasksData.form.estimatedLabel}
          placeholder={tasksData.form.estimatedPlaceholder}
          value={form.estimated_hours}
          onChange={handleChange("estimated_hours")}
          required
        />
        <Select
          id="status"
          label={tasksData.form.statusLabel}
          value={form.status}
          onChange={handleChange("status")}
          options={TASK_STATUS_OPTIONS}
        />
      </div>

      {!task ? (
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={form.use_current_time}
            onChange={handleChange("use_current_time")}
            className="rounded border-border text-primary focus:ring-primary/20"
          />
          {tasksData.form.useCurrentTime}
        </label>
      ) : null}

      {!form.use_current_time || task ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="start_time"
            type="datetime-local"
            label={tasksData.form.startTimeLabel}
            value={form.start_time}
            onChange={handleChange("start_time")}
          />
          {task ? (
            <Input
              id="deadline"
              type="datetime-local"
              label={tasksData.form.endTimeLabel}
              value={form.deadline}
              onChange={handleChange("deadline")}
            />
          ) : null}
        </div>
      ) : null}

      {task ? (
        <div>
          <Input
            id="actual_hours"
            type="number"
            min="0"
            step="0.1"
            label={tasksData.form.actualLabel}
            placeholder={tasksData.form.actualPlaceholder}
            value={form.actual_hours}
            onChange={handleChange("actual_hours")}
          />
          {form.status === "completed" && form.actual_hours === "" ? (
            <p className="mt-1.5 text-xs text-text-muted">
              {tasksData.form.actualAutoHint}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {tasksData.form.cancel}
        </Button>
        <Button type="submit" loading={submitting}>
          {tasksData.form.submit}
        </Button>
      </div>
    </form>
  );
}
