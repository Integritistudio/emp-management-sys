import { Suspense } from "react";
import { ProjectsPageContent } from "@/components/projects/ProjectsPageContent";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

export default function ProjectsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={6} cols={11} />}>
      <ProjectsPageContent />
    </Suspense>
  );
}
