import { ProjectDetailContent } from "@/components/projects/ProjectDetailContent";
import { AdminOnly } from "@/components/layout/AdminOnly";

export default async function ProjectDetailPage({ params }) {
  const { id } = await params;

  return (
    <AdminOnly>
      <ProjectDetailContent projectId={id} />
    </AdminOnly>
  );
}
