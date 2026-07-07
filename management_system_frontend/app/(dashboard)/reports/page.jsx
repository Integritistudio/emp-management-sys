import { Suspense } from "react";
import { ReportsPageContent } from "@/components/reports/ReportsPageContent";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

export default function ReportsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={6} cols={6} />}>
      <ReportsPageContent />
    </Suspense>
  );
}
