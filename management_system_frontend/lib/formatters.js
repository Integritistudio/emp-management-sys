export function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format an ISO/UTC timestamp for <input type="datetime-local">.
 * datetime-local always expects the user's LOCAL time, not UTC.
 * Using toISOString().slice(0,16) shifts by timezone (e.g. UTC+5 shows 5 h early).
 */
export function toDatetimeLocalValue(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parse datetime-local string (local time) to ISO UTC for the API. */
export function fromDatetimeLocalValue(localValue) {
  if (!localValue) return null;
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function formatDateTime(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** PDF 8.6 — completed tasks show completion time; others show deadline. */
export function getTaskEndDateTime(task) {
  if (!task) return null;
  if (task.status === "completed" && task.completed_at) {
    return task.completed_at;
  }
  return task.deadline;
}

export function formatHours(value) {
  if (value === null || value === undefined) return "—";
  return Number(value).toFixed(2);
}

export function formatPercent(value) {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toFixed(1)}%`;
}

export function formatLabel(value) {
  if (!value) return "—";
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getStatusVariant(status) {
  const variants = {
    not_started: "default",
    in_progress: "primary",
    active: "primary",
    paused: "warning",
    on_hold: "warning",
    completed: "success",
    cancelled: "danger",
    delayed: "danger",
  };
  return variants[status] || "default";
}

export function getQualityVariant(quality) {
  const variants = {
    low: "warning",
    medium: "default",
    high: "success",
  };
  return variants[quality] || "default";
}
