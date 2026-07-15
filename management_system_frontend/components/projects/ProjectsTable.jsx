"use client";

import { useRouter } from "next/navigation";
import { projectsData } from "@/data/projects";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { TableActionButtons } from "@/components/ui/TableActionButtons";
import { SortableHeader } from "@/components/ui/SortableHeader";
import {
  formatDate,
  formatHours,
  formatLabel,
  formatPercent,
  getQualityVariant,
  getStatusVariant,
} from "@/lib/formatters";

const STICKY_NAME_HEAD = "sticky left-0 z-30 bg-parchment";
const STICKY_NAME_CELL =
  "sticky left-0 z-20 bg-surface group-hover:bg-parchment font-medium text-primary";

export function ProjectsTable({ projects, onEdit, onDelete, sort, onSort }) {
  const router = useRouter();

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell className={STICKY_NAME_HEAD}>
            <SortableHeader
              label={projectsData.table.name}
              column="name"
              currentSort={sort}
              onSort={onSort}
            />
          </TableHeaderCell>
          <TableHeaderCell>{projectsData.table.lead}</TableHeaderCell>
          <TableHeaderCell>
            <SortableHeader
              label={projectsData.table.startDate}
              column="start_date"
              currentSort={sort}
              onSort={onSort}
            />
          </TableHeaderCell>
          <TableHeaderCell>
            <SortableHeader
              label={projectsData.table.quality}
              column="quality"
              currentSort={sort}
              onSort={onSort}
            />
          </TableHeaderCell>
          <TableHeaderCell>
            <SortableHeader
              label={projectsData.table.status}
              column="status"
              currentSort={sort}
              onSort={onSort}
            />
          </TableHeaderCell>
          <TableHeaderCell>{projectsData.table.totalTasks}</TableHeaderCell>
          <TableHeaderCell>{projectsData.table.estimated}</TableHeaderCell>
          <TableHeaderCell>{projectsData.table.actual}</TableHeaderCell>
          <TableHeaderCell>{projectsData.table.variance}</TableHeaderCell>
          <TableHeaderCell>{projectsData.table.efficiency}</TableHeaderCell>
          <TableHeaderCell>{projectsData.table.actions}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {projects.map((project) => (
          <TableRow
            key={project.id}
            clickable
            onClick={() => router.push(`/projects/${project.id}`)}
          >
            <TableCell className={STICKY_NAME_CELL}>
              <div className="min-w-[140px]">{project.name}</div>
            </TableCell>
            <TableCell>{project.lead_developer_name || "—"}</TableCell>
            <TableCell>{formatDate(project.start_date)}</TableCell>
            <TableCell>
              <Badge variant={getQualityVariant(project.quality)}>
                {formatLabel(project.quality)}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(project.status)}>
                {formatLabel(project.status)}
              </Badge>
            </TableCell>
            <TableCell>{project.total_tasks}</TableCell>
            <TableCell>{formatHours(project.total_estimated_time)}</TableCell>
            <TableCell>{formatHours(project.total_actual_time)}</TableCell>
            <TableCell>{formatHours(project.project_variance)}</TableCell>
            <TableCell>{formatPercent(project.project_efficiency_rate)}</TableCell>
            <TableCell>
              <TableActionButtons
                viewHref={`/projects/${project.id}`}
                onEdit={() => onEdit(project)}
                onDelete={() => onDelete(project)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
