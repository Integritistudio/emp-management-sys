import { ProjectDetailContent } from "@/components/projects/ProjectDetailContent";
import { RequireRoles } from "@/components/layout/AdminOnly";

export default async function ProjectDetailPage({ params }) {
  const { id } = await params;

  return (
    <RequireRoles roles={["admin", "project_admin"]}>
      <ProjectDetailContent projectId={id} />
    </RequireRoles>
  );
}
