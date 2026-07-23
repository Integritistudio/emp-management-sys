export const navigationData = {
  brand: {
    name: "Integriti",
    subtitle: "Integriti Employee Management System",
    logo: "/images/logo.webp",
  },
  links: [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: "LayoutDashboard",
      roles: ["admin", "project_admin", "member"],
    },
    {
      label: "Projects",
      href: "/projects",
      icon: "FolderKanban",
      roles: ["admin", "project_admin"],
    },
    {
      label: "Team",
      href: "/team",
      icon: "Users",
      roles: ["admin", "project_admin"],
    },
    {
      label: "Project Managers",
      href: "/project-managers",
      icon: "UserCog",
      roles: ["admin"],
    },
    {
      label: "Task Management",
      href: "/tasks",
      icon: "ListTodo",
      roles: ["admin", "project_admin", "member"],
    },
    {
      label: "Reports",
      href: "/reports",
      icon: "BarChart3",
      roles: ["admin", "project_admin", "member"],
    },
  ],
  changePassword: {
    label: "Change Password",
    icon: "KeyRound",
  },
  signOut: {
    label: "Sign Out",
    icon: "LogOut",
  },
};

export function getNavLinksForRole(role = "admin") {
  return navigationData.links.filter((link) =>
    (link.roles || ["admin"]).includes(role)
  );
}
