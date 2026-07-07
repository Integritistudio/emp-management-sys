export const teamData = {
  pageTitle: "Team",
  subtitle: "Manage team members and monitor performance",
  addButton: "Add Team Member",
  emptyTitle: "No team members yet",
  emptyDescription: "Add your first team member to get started.",
  form: {
    title: "Add Team Member",
    editTitle: "Edit Team Member",
    titleLabel: "Title",
    titlePlaceholder: "e.g. Senior Developer",
    nameLabel: "Full Name",
    namePlaceholder: "Enter full name",
    emailLabel: "Email",
    emailPlaceholder: "developer@integriti.io",
    submit: "Save Member",
    cancel: "Cancel",
  },
  card: {
    tasksAssigned: "Tasks Assigned",
    timeLogged: "Time Logged (hrs)",
    efficiency: "Efficiency",
    matrixRating: "Matrix Rating",
  },
  searchPlaceholder: "Search by name, email, or title...",
  filters: {
    title: "Title",
    titlePlaceholder: "All titles",
    efficiency: "Efficiency",
    efficiencyPlaceholder: "All ranges",
  },
  searching: "Updating results...",
};

export const TEAM_EFFICIENCY_FILTER_OPTIONS = [
  { value: "gt_100", label: "Greater than 100%" },
  { value: "lt_60", label: "Less than 60%" },
  { value: "60_80", label: "60% to 80%" },
  { value: "80_90", label: "80% to 90%" },
  { value: "90_100", label: "90% to 100%" },
];

export const TEAM_QUALITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
