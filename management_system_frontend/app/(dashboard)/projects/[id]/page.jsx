import { ProjectDetailContent } from "@/components/projects/ProjectDetailContent";

export default async function ProjectDetailPage({ params }) {
  const { id } = await params;

  return <ProjectDetailContent projectId={id} />;
}
