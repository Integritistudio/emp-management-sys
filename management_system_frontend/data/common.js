export const commonData = {
  actions: {
    view: "View",
    edit: "Edit",
    delete: "Delete",
    pause: "Pause",
    resume: "Resume",
    complete: "Complete",
  },
  confirm: {
    cancel: "Cancel",
    delete: "Delete",
    confirm: "Confirm",
  },
  delete: {
    teamTitle: "Delete Team Member",
    teamMessage: (name) =>
      `Are you sure you want to remove ${name}? This action cannot be undone.`,
    projectTitle: "Delete Project",
    projectMessage: (name, taskCount = 0) => {
      const tasks = Number(taskCount) || 0;
      if (tasks > 0) {
        return `Are you sure you want to delete "${name}"? This will permanently delete all ${tasks} linked task${tasks === 1 ? "" : "s"}, including logged hours, statuses, and stats. This cannot be undone.`;
      }
      return `Are you sure you want to delete "${name}"? This will permanently remove the project and any linked task data. This cannot be undone.`;
    },
    taskTitle: "Delete Task",
    taskMessage: (name) =>
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
  },
};
