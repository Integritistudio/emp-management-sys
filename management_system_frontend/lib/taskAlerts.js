const NEAR_DEADLINE_HOURS = 2;
const HIGH_VARIANCE_HOURS = 2;

export function getTaskAlerts(task) {
  const alerts = [];
  const now = new Date();

  if (task.status === "paused") {
    alerts.push({ key: "paused", label: "Paused", variant: "warning" });
  }

  if (task.status === "on_hold") {
    alerts.push({ key: "on_hold", label: "On Hold", variant: "warning" });
  }

  if (
    task.deadline &&
    !["completed", "cancelled"].includes(task.status)
  ) {
    const deadline = new Date(task.deadline);
    if (now > deadline) {
      alerts.push({ key: "overdue", label: "Overdue", variant: "danger" });
    } else {
      const hoursLeft = (deadline - now) / (1000 * 60 * 60);
      if (hoursLeft <= NEAR_DEADLINE_HOURS) {
        alerts.push({
          key: "near_deadline",
          label: "Near Deadline",
          variant: "warning",
        });
      }
    }
  }

  if (
    task.variance !== null &&
    task.variance !== undefined &&
    Number(task.variance) > HIGH_VARIANCE_HOURS
  ) {
    alerts.push({
      key: "high_variance",
      label: "High Variance",
      variant: "danger",
    });
  }

  if (
    task.deadline &&
    task.status === "in_progress" &&
    new Date(task.deadline) < now
  ) {
    alerts.push({ key: "delayed", label: "Delayed", variant: "danger" });
  }

  return alerts;
}

export function getTaskRowClass(task) {
  const alerts = getTaskAlerts(task);
  if (alerts.some((a) => a.key === "overdue" || a.key === "delayed")) {
    return "bg-red-50/60";
  }
  if (alerts.some((a) => a.key === "near_deadline")) {
    return "bg-amber-50/60";
  }
  if (alerts.some((a) => a.key === "paused" || a.key === "on_hold")) {
    return "bg-yellow-50/40";
  }
  if (alerts.some((a) => a.key === "high_variance")) {
    return "bg-orange-50/50";
  }
  return "";
}
