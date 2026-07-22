import { TeamMemberDetailContent } from "@/components/team/TeamMemberDetailContent";
import { AdminOnly } from "@/components/layout/AdminOnly";

export default async function TeamMemberDetailPage({ params }) {
  const { id } = await params;

  return (
    <AdminOnly>
      <TeamMemberDetailContent memberId={id} />
    </AdminOnly>
  );
}
