export const commonData = {
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
    projectMessage: (name) =>
      `Are you sure you want to delete "${name}"? All linked task data may be affected.`,
    taskTitle: "Delete Task",
    taskMessage: (name) =>
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
  },
};
