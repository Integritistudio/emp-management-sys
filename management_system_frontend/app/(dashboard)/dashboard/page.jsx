import { Suspense } from "react";
import { DashboardPageContent } from "@/components/dashboard/DashboardPageContent";
import { CardGridSkeleton } from "@/components/ui/TableSkeleton";

export default function DashboardPage() {
  return (
    <Suspense fallback={<CardGridSkeleton count={5} />}>
      <DashboardPageContent />
    </Suspense>
  );
}
