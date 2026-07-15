"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dashboardData } from "@/data/dashboard";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import { formatHours } from "@/lib/formatters";
import { PaginatedTable } from "@/components/ui/PaginatedTable";

const BAR_COLORS = [
  "#004d4d",
  "#1a56db",
  "#706fd3",
  "#059669",
  "#d97706",
  "#db2777",
  "#0891b2",
  "#4f46e5",
];

function VolumeTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-sm">
      <p className="text-sm font-semibold text-text-primary">{row.name}</p>
      <p className="mt-1 text-xs text-text-secondary">
        Assigned: <span className="font-medium text-text-primary">{row.assigned}</span>
      </p>
      <p className="text-xs text-text-secondary">
        Completed:{" "}
        <span className="font-medium text-text-primary">{row.completed}</span>
      </p>
      <p className="text-xs text-text-secondary">
        Active: <span className="font-medium text-text-primary">{row.active}</span>
      </p>
      <p className="text-xs text-text-secondary">
        Time logged:{" "}
        <span className="font-medium text-text-primary">
          {formatHours(row.timeLogged)}h
        </span>
      </p>
    </div>
  );
}

export function TeamPerformanceTable({ data, loading }) {
  const chartData = (data || []).map((member) => ({
    id: member.id,
    name: member.full_name,
    shortName:
      member.full_name.length > 14
        ? `${member.full_name.slice(0, 12)}…`
        : member.full_name,
    assigned: member.total_tasks,
    completed: member.completed_tasks,
    active: member.active_tasks,
    timeLogged: Number(member.total_time_logged || 0),
    volume: member.performance_percent,
  }));

  return (
    <Card>
      <div className="mb-5">
        <h2 className="text-tagline font-semibold text-text-primary">
          {dashboardData.teamPerformance.title}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {dashboardData.teamPerformance.subtitle}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      ) : !data?.length ? (
        <EmptyState
          title={dashboardData.teamPerformance.empty}
          description=""
        />
      ) : (
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {dashboardData.teamPerformance.chartTitle}
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#7a7a7a" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="shortName"
                    width={96}
                    tick={{ fontSize: 11, fill: "#454545" }}
                  />
                  <Tooltip content={<VolumeTooltip />} cursor={{ fill: "rgba(0,77,77,0.06)" }} />
                  <Bar
                    dataKey="assigned"
                    name={dashboardData.teamPerformance.assigned}
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={entry.id}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <PaginatedTable items={data}>
            {(pageMembers) => (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>
                      {dashboardData.teamPerformance.name}
                    </TableHeaderCell>
                    <TableHeaderCell>
                      {dashboardData.teamPerformance.assigned}
                    </TableHeaderCell>
                    <TableHeaderCell>
                      {dashboardData.teamPerformance.completed}
                    </TableHeaderCell>
                    <TableHeaderCell>
                      {dashboardData.teamPerformance.active}
                    </TableHeaderCell>
                    <TableHeaderCell>
                      {dashboardData.teamPerformance.timeLogged}
                    </TableHeaderCell>
                    <TableHeaderCell>
                      <span>{dashboardData.teamPerformance.progress}</span>
                      <span className="mt-0.5 block text-[10px] font-normal normal-case text-text-muted">
                        {dashboardData.teamPerformance.progressHint}
                      </span>
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageMembers.map((member, index) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <p className="font-medium text-text-primary">
                          {member.full_name}
                        </p>
                        {member.title ? (
                          <p className="text-xs text-text-muted">{member.title}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>{member.total_tasks}</TableCell>
                      <TableCell>{member.completed_tasks}</TableCell>
                      <TableCell>{member.active_tasks}</TableCell>
                      <TableCell>{formatHours(member.total_time_logged)}</TableCell>
                      <TableCell className="min-w-[160px]">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-background">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${member.performance_percent}%`,
                                backgroundColor:
                                  BAR_COLORS[index % BAR_COLORS.length],
                              }}
                              title={`${member.total_tasks} assigned`}
                            />
                          </div>
                          <span className="whitespace-nowrap text-xs font-medium text-text-secondary">
                            {member.total_tasks}{" "}
                            {dashboardData.teamPerformance.tasksLabel}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </PaginatedTable>
        </div>
      )}
    </Card>
  );
}
