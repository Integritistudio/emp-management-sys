import { TeamMemberDetailContent } from "@/components/team/TeamMemberDetailContent";
import { RequireRoles } from "@/components/layout/AdminOnly";

export default async function TeamMemberDetailPage({ params }) {
  const { id } = await params;

  return (
    <RequireRoles roles={["admin", "project_admin"]}>
      <TeamMemberDetailContent memberId={id} />
    </RequireRoles>
  );
}
