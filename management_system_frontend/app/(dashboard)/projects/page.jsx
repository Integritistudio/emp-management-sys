import { Suspense } from "react";
import { ProjectsPageContent } from "@/components/projects/ProjectsPageContent";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { AdminOnly } from "@/components/layout/AdminOnly";

export default function ProjectsPage() {
  return (
    <AdminOnly>
      <Suspense fallback={<TableSkeleton rows={6} cols={11} />}>
        <ProjectsPageContent />
      </Suspense>
    </AdminOnly>
  );
}
