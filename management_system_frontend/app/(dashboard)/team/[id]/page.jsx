import { TeamMemberDetailContent } from "@/components/team/TeamMemberDetailContent";

export default async function TeamMemberDetailPage({ params }) {
  const { id } = await params;

  return <TeamMemberDetailContent memberId={id} />;
}
