import { Suspense } from "react";
import { TeamPageContent } from "@/components/team/TeamPageContent";
import { CardGridSkeleton } from "@/components/ui/TableSkeleton";
import { AdminOnly } from "@/components/layout/AdminOnly";

export default function TeamPage() {
  return (
    <AdminOnly>
      <Suspense fallback={<CardGridSkeleton count={6} />}>
        <TeamPageContent />
      </Suspense>
    </AdminOnly>
  );
}
