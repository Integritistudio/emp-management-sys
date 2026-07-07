import { Suspense } from "react";
import { TeamPageContent } from "@/components/team/TeamPageContent";
import { CardGridSkeleton } from "@/components/ui/TableSkeleton";

export default function TeamPage() {
  return (
    <Suspense fallback={<CardGridSkeleton count={6} />}>
      <TeamPageContent />
    </Suspense>
  );
}
