import { Suspense } from "react";
import { TasksPageContent } from "@/components/tasks/TasksPageContent";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

export default function TasksPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={6} cols={12} />}>
      <TasksPageContent />
    </Suspense>
  );
}
