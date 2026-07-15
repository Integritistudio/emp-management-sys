/**
 * Professional bulk-action policy (PDF §11.6).
 * Bulk is for live/open work — not rewriting completed history.
 */

const OPEN_STATUSES = new Set([
  "not_started",
  "in_progress",
  "paused",
  "on_hold",
]);

const CLOSED_STATUSES = new Set(["completed", "cancelled"]);

/** Allowed target statuses from each current status (bulk change_status). */
const STATUS_TRANSITIONS = {
  not_started: new Set(["in_progress", "on_hold", "completed", "cancelled"]),
  in_progress: new Set([
    "paused",
    "on_hold",
    "completed",
    "cancelled",
    "not_started",
  ]),
  paused: new Set(["in_progress", "on_hold", "completed", "cancelled"]),
  on_hold: new Set(["in_progress", "completed", "cancelled"]),
  completed: new Set([]),
  cancelled: new Set([]),
};

const CLOSED_SKIP =
  "Skipped — completed/cancelled tasks cannot be changed in bulk (edit individually to correct history).";

const evaluateBulkAction = (task, action, value) => {
  if (!task) {
    return { allowed: false, skipped: true, message: "Task not found" };
  }

  const status = String(task.status || "")
    .trim()
    .toLowerCase();

  switch (action) {
    case "assign": {
      if (CLOSED_STATUSES.has(status)) {
        return { allowed: false, skipped: true, message: CLOSED_SKIP };
      }
      if (!OPEN_STATUSES.has(status)) {
        return {
          allowed: false,
          skipped: true,
          message: `Skipped — cannot reassign a ${status} task in bulk.`,
        };
      }
      return { allowed: true };
    }

    case "move_project": {
      if (CLOSED_STATUSES.has(status)) {
        return { allowed: false, skipped: true, message: CLOSED_SKIP };
      }
      if (!OPEN_STATUSES.has(status)) {
        return {
          allowed: false,
          skipped: true,
          message: `Skipped — cannot move a ${status} task in bulk.`,
        };
      }
      return { allowed: true };
    }

    case "on_hold": {
      if (status === "on_hold") {
        return {
          allowed: false,
          skipped: true,
          message: "Skipped — task is already on hold.",
        };
      }
      if (!["in_progress", "paused"].includes(status)) {
        return {
          allowed: false,
          skipped: true,
          message:
            "Skipped — only In Progress or Paused tasks can be put on hold.",
        };
      }
      return { allowed: true };
    }

    case "complete": {
      if (CLOSED_STATUSES.has(status)) {
        return {
          allowed: false,
          skipped: true,
          message: "Skipped — task is already finished.",
        };
      }
      if (!OPEN_STATUSES.has(status)) {
        return {
          allowed: false,
          skipped: true,
          message: `Skipped — cannot complete a ${status} task in bulk.`,
        };
      }
      return { allowed: true };
    }

    case "change_status": {
      if (!value) {
        return {
          allowed: false,
          skipped: true,
          message: "Skipped — no target status selected.",
        };
      }
      const target = String(value).trim().toLowerCase();
      if (CLOSED_STATUSES.has(status)) {
        return { allowed: false, skipped: true, message: CLOSED_SKIP };
      }
      if (target === status) {
        return {
          allowed: false,
          skipped: true,
          message: `Skipped — task is already ${status}.`,
        };
      }
      const allowedTargets = STATUS_TRANSITIONS[status] || new Set();
      if (!allowedTargets.has(target)) {
        return {
          allowed: false,
          skipped: true,
          message: `Skipped — cannot change status from ${status} to ${target} in bulk.`,
        };
      }
      return { allowed: true };
    }

    default:
      return {
        allowed: false,
        skipped: true,
        message: "Skipped — invalid bulk action.",
      };
  }
};

const summarizeBulkResults = (results = []) => {
  const updated = results.filter((r) => r.success).length;
  const skipped = results.filter((r) => r.skipped).length;
  const failed = results.filter((r) => !r.success && !r.skipped && !r.requiresConfirmation)
    .length;
  const pending = results.filter((r) => r.requiresConfirmation).length;

  return { updated, skipped, failed, pending, total: results.length };
};

module.exports = {
  OPEN_STATUSES,
  CLOSED_STATUSES,
  STATUS_TRANSITIONS,
  evaluateBulkAction,
  summarizeBulkResults,
};
