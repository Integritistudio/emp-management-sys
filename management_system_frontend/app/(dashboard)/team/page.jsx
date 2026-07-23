import { Suspense } from "react";
import { TeamPageContent } from "@/components/team/TeamPageContent";
import { CardGridSkeleton } from "@/components/ui/TableSkeleton";
import { RequireRoles } from "@/components/layout/AdminOnly";

export default function TeamPage() {
  return (
    <RequireRoles roles={["admin", "project_admin"]}>
      <Suspense fallback={<CardGridSkeleton count={6} />}>
        <TeamPageContent />
      </Suspense>
    </RequireRoles>
  );
}
