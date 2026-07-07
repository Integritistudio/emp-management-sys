"use client";

import { dashboardData } from "@/data/dashboard";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatHours, formatPercent } from "@/lib/formatters";

export function TeamPerformanceTable({ data, loading }) {
  return (
    <Card>
      <h2 className="mb-4 text-tagline font-semibold text-text-primary">
        {dashboardData.teamPerformance.title}
      </h2>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          title={dashboardData.teamPerformance.empty}
          description=""
        />
      ) : (
        <div className="space-y-4">
          {data.map((member) => (
            <div key={member.id} className="space-y-2">
              <div className="flex items-start justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium text-text-primary">{member.full_name}</p>
                  <p className="text-xs text-text-muted">{member.title}</p>
                </div>
                <div className="text-right text-xs text-text-secondary">
                  <p>
                    {dashboardData.teamPerformance.assigned}: {member.total_tasks} ·{" "}
                    {dashboardData.teamPerformance.completed}: {member.completed_tasks} ·{" "}
                    {dashboardData.teamPerformance.active}: {member.active_tasks}
                  </p>
                  <p>
                    {dashboardData.teamPerformance.timeLogged}:{" "}
                    {formatHours(member.total_time_logged)} ·{" "}
                    {formatPercent(member.efficiency_rate)}
                  </p>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${member.performance_percent}%` }}
                  title={dashboardData.teamPerformance.progress}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
