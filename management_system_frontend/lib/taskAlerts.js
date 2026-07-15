/**
 * PDF §20 — Deadline Alerts (visual only)
 *
 * Highlights tasks that are:
 * - Near deadline (within NEAR_DEADLINE_HOURS of deadline)
 * - Overdue (past deadline, still open)
 * - Paused / On Hold (status)
 * - Delayed (in progress and elapsed work time exceeds estimate)
 * - High variance (completed with variance above HIGH_VARIANCE_HOURS)
 */

export const NEAR_DEADLINE_HOURS = 2;
export const HIGH_VARIANCE_HOURS = 2;

const CLOSED = new Set(["completed", "cancelled"]);
const FROZEN = new Set(["paused", "on_hold"]);

function isTimerFrozen(task) {
  return Boolean(task.paused_at) && FROZEN.has(task.status);
}

/** Matches backend taskTimerService.calculateElapsedHours (pause-aware). */
export function calculateElapsedHours(task, now = new Date()) {
  if (!task?.start_time) return 0;

  const start = new Date(task.start_time).getTime();
  let elapsedMs = now.getTime() - start;
  elapsedMs -= Number(task.total_paused_hours || 0) * 60 * 60 * 1000;

  if (task.paused_at && FROZEN.has(task.status)) {
    elapsedMs -= now.getTime() - new Date(task.paused_at).getTime();
  }

  return Math.max(0, Number((elapsedMs / (60 * 60 * 1000)).toFixed(2)));
}

function resolveVariance(task) {
  if (task.variance !== null && task.variance !== undefined) {
    return Number(task.variance);
  }
  if (task.actual_hours === null || task.actual_hours === undefined) {
    return null;
  }
  const actual = Number(task.actual_hours) || 0;
  const estimated = Number(task.estimated_hours) || 0;
  return Number((actual - estimated).toFixed(2));
}

export function getTaskAlerts(task, now = new Date()) {
  if (!task) return [];

  const alerts = [];

  // Status alerts
  if (task.status === "paused") {
    alerts.push({ key: "paused", label: "Paused", variant: "alertPaused" });
  }
  if (task.status === "on_hold") {
    alerts.push({ key: "on_hold", label: "On Hold", variant: "alertOnHold" });
  }

  // Deadline alerts — skip while timer is frozen (PDF §11.2)
  if (task.deadline && !CLOSED.has(task.status) && !isTimerFrozen(task)) {
    const deadline = new Date(task.deadline);
    if (now > deadline) {
      alerts.push({ key: "overdue", label: "Overdue", variant: "alertOverdue" });
    } else {
      const hoursLeft = (deadline - now) / (1000 * 60 * 60);
      if (hoursLeft <= NEAR_DEADLINE_HOURS) {
        alerts.push({
          key: "near_deadline",
          label: "Near Deadline",
          variant: "alertNearDeadline",
        });
      }
    }
  }

  // Delayed = actively working past estimated effort (distinct from overdue deadline)
  if (
    task.status === "in_progress" &&
    !isTimerFrozen(task) &&
    Number(task.estimated_hours) > 0
  ) {
    const elapsed = calculateElapsedHours(task, now);
    if (elapsed > Number(task.estimated_hours)) {
      alerts.push({ key: "delayed", label: "Delayed", variant: "alertDelayed" });
    }
  }

  // High variance on completed work (PDF §21.1 variance)
  if (task.status === "completed") {
    const variance = resolveVariance(task);
    if (variance !== null && variance > HIGH_VARIANCE_HOURS) {
      alerts.push({
        key: "high_variance",
        label: "High Variance",
        variant: "alertHighVariance",
      });
    }
  }

  return alerts;
}

/** Row tint priority: overdue → delayed → near deadline → paused → hold → high variance */
export function getTaskRowClass(task, now = new Date()) {
  const keys = new Set(getTaskAlerts(task, now).map((a) => a.key));
  if (keys.has("overdue")) return "bg-red-50/60";
  if (keys.has("delayed")) return "bg-fuchsia-50/50";
  if (keys.has("near_deadline")) return "bg-amber-50/60";
  if (keys.has("paused")) return "bg-sky-50/50";
  if (keys.has("on_hold")) return "bg-violet-50/50";
  if (keys.has("high_variance")) return "bg-orange-50/50";
  return "";
}

/**
 * Opaque sticky-cell backgrounds so horizontal scroll doesn't show
 * through the frozen columns (matches row alert tints).
 */
export function getTaskStickyCellClass(task, now = new Date()) {
  const keys = new Set(getTaskAlerts(task, now).map((a) => a.key));
  if (keys.has("overdue")) return "bg-red-50 group-hover:bg-red-100/80";
  if (keys.has("delayed")) return "bg-fuchsia-50 group-hover:bg-fuchsia-100/70";
  if (keys.has("near_deadline")) return "bg-amber-50 group-hover:bg-amber-100/80";
  if (keys.has("paused")) return "bg-sky-50 group-hover:bg-sky-100/70";
  if (keys.has("on_hold")) return "bg-violet-50 group-hover:bg-violet-100/70";
  if (keys.has("high_variance")) return "bg-orange-50 group-hover:bg-orange-100/70";
  return "bg-surface group-hover:bg-parchment";
}

export const ALERT_LEGEND = [
  { key: "near_deadline", label: "Near Deadline", swatch: "border-amber-300 bg-amber-50 text-amber-800" },
  { key: "overdue", label: "Overdue", swatch: "border-red-300 bg-red-50 text-red-700" },
  { key: "delayed", label: "Delayed", swatch: "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700" },
  { key: "paused", label: "Paused", swatch: "border-sky-300 bg-sky-50 text-sky-700" },
  { key: "on_hold", label: "On Hold", swatch: "border-violet-300 bg-violet-50 text-violet-700" },
  { key: "high_variance", label: "High Variance", swatch: "border-orange-300 bg-orange-50 text-orange-700" },
];
