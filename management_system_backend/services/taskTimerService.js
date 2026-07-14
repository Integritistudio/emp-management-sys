const { addWallClockHours } = require("./calculationService");

const MS_PER_HOUR = 60 * 60 * 1000;

const FROZEN_STATUSES = new Set(["paused", "on_hold"]);

const calculateElapsedHours = (task, now = new Date()) => {
  if (!task.start_time) return 0;

  const start = new Date(task.start_time).getTime();
  let elapsedMs = now.getTime() - start;

  const totalPausedMs = Number(task.total_paused_hours || 0) * MS_PER_HOUR;
  elapsedMs -= totalPausedMs;

  if (task.paused_at) {
    elapsedMs -= now.getTime() - new Date(task.paused_at).getTime();
  }

  return Math.max(0, Number((elapsedMs / MS_PER_HOUR).toFixed(2)));
};

/** Deadline accounting for an active pause/hold freeze (PDF 11.2). */
const getEffectiveDeadline = (task, now = new Date()) => {
  if (!task.deadline) return null;

  let deadlineMs = new Date(task.deadline).getTime();

  if (task.paused_at && FROZEN_STATUSES.has(task.status)) {
    deadlineMs += now.getTime() - new Date(task.paused_at).getTime();
  }

  return new Date(deadlineMs);
};

const isOverdue = (task, now = new Date()) => {
  if (!task.deadline || task.status === "completed" || task.status === "cancelled") {
    return false;
  }

  // PDF 11.2 — while paused/on hold, deadline countdown is frozen
  if (task.paused_at && FROZEN_STATUSES.has(task.status)) {
    return false;
  }

  return now > new Date(task.deadline);
};

const pauseTask = (task) => {
  if (task.status !== "in_progress") {
    throw new Error("Only in-progress tasks can be paused");
  }
  if (task.paused_at) {
    throw new Error("Task is already paused");
  }

  return {
    status: "paused",
    paused_at: new Date(),
  };
};

/** Put task on hold and freeze the timer/deadline (PDF 11.6). */
const holdTask = (task) => {
  if (["completed", "cancelled", "on_hold"].includes(task.status)) {
    throw new Error("Task cannot be put on hold from its current status");
  }

  return {
    status: "on_hold",
    paused_at: task.paused_at || new Date(),
  };
};

/**
 * Resume from paused or on_hold (PDF 11.3).
 * Extends deadline by the frozen duration so pause time is not counted.
 */
const resumeTask = (task) => {
  if (!FROZEN_STATUSES.has(task.status)) {
    throw new Error("Only paused or on-hold tasks can be resumed");
  }

  const now = new Date();

  if (!task.paused_at) {
    return {
      status: "in_progress",
      paused_at: null,
    };
  }

  const pausedMs = now.getTime() - new Date(task.paused_at).getTime();
  const pausedHours = pausedMs / MS_PER_HOUR;
  const newDeadline = task.deadline
    ? addWallClockHours(task.deadline, pausedHours)
    : task.deadline;

  return {
    status: "in_progress",
    paused_at: null,
    total_paused_hours: Number(task.total_paused_hours || 0) + pausedHours,
    deadline: newDeadline,
  };
};

const completeTask = (task, { confirm = false, actual_hours } = {}) => {
  if (["completed", "cancelled"].includes(task.status)) {
    throw new Error("Task is already finished");
  }

  const now = new Date();

  // Apply any open pause before overdue/elapsed checks so frozen time is fair
  let workingTask = task;
  if (task.paused_at && FROZEN_STATUSES.has(task.status)) {
    const resumed = resumeTask(task);
    workingTask = { ...task, ...resumed };
  }

  const overdue = isOverdue(workingTask, now);

  if (overdue && !confirm) {
    return {
      requiresConfirmation: true,
      message:
        "Was this task actually completed within the estimated time?",
      overdue: true,
      elapsed_hours: calculateElapsedHours(workingTask, now),
    };
  }

  const actualHours =
    actual_hours !== undefined && actual_hours !== null
      ? Number(actual_hours)
      : calculateElapsedHours(workingTask, now);

  return {
    requiresConfirmation: false,
    status: "completed",
    actual_hours: actualHours,
    completed_at: now,
    paused_at: null,
    total_paused_hours: workingTask.total_paused_hours,
    deadline: workingTask.deadline,
  };
};

module.exports = {
  calculateElapsedHours,
  getEffectiveDeadline,
  isOverdue,
  pauseTask,
  holdTask,
  resumeTask,
  completeTask,
  FROZEN_STATUSES,
};
