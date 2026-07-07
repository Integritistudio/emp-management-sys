const { addWallClockHours } = require("./calculationService");

const MS_PER_HOUR = 60 * 60 * 1000;

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

const isOverdue = (task, now = new Date()) => {
  if (!task.deadline || task.status === "completed" || task.status === "cancelled") {
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

const resumeTask = (task) => {
  if (task.status !== "paused" || !task.paused_at) {
    throw new Error("Task is not paused");
  }

  const now = new Date();
  const pausedMs = now.getTime() - new Date(task.paused_at).getTime();
  const pausedHours = pausedMs / MS_PER_HOUR;
  const newDeadline = addWallClockHours(task.deadline, pausedHours);

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
  const overdue = isOverdue(task, now);

  if (overdue && !confirm) {
    return {
      requiresConfirmation: true,
      message:
        "Was this task actually completed within the estimated time?",
      overdue: true,
      elapsed_hours: calculateElapsedHours(task, now),
    };
  }

  const actualHours =
    actual_hours !== undefined && actual_hours !== null
      ? Number(actual_hours)
      : calculateElapsedHours(task, now);

  return {
    requiresConfirmation: false,
    status: "completed",
    actual_hours: actualHours,
    completed_at: now,
    paused_at: null,
  };
};

module.exports = {
  calculateElapsedHours,
  isOverdue,
  pauseTask,
  resumeTask,
  completeTask,
};
