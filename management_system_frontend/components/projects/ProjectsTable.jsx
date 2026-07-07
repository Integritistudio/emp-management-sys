"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/Button";
import { SortableHeader } from "@/components/ui/SortableHeader";
import {
  formatDate,
  formatHours,
  formatLabel,
  formatPercent,
  getQualityVariant,
  getStatusVariant,
} from "@/lib/formatters";

export function ProjectsTable({ projects, onEdit, onDelete, sort, onSort }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>
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
          <TableRow key={project.id}>
            <TableCell className="font-medium">{project.name}</TableCell>
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
              <div className="flex items-center gap-1">
                <Link href={`/projects/${project.id}`}>
                  <Button variant="ghost" className="px-2 py-1.5">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="px-2 py-1.5"
                  onClick={() => onEdit(project)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="px-2 py-1.5"
                  onClick={() => onDelete(project)}
                >
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
