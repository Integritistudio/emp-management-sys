import { ProjectManagersPageContent } from "@/components/project-managers/ProjectManagersPageContent";
import { AdminOnly } from "@/components/layout/AdminOnly";

export default function ProjectManagersPage() {
  return (
    <AdminOnly>
      <ProjectManagersPageContent />
    </AdminOnly>
  );
}
