import { Suspense } from "react";
import { ProjectsPageContent } from "@/components/projects/ProjectsPageContent";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { RequireRoles } from "@/components/layout/AdminOnly";

export default function ProjectsPage() {
  return (
    <RequireRoles roles={["admin", "project_admin"]}>
      <Suspense fallback={<TableSkeleton rows={6} cols={11} />}>
        <ProjectsPageContent />
      </Suspense>
    </RequireRoles>
  );
}
