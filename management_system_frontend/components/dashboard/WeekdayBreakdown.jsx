"use client";

import { dashboardData } from "@/data/dashboard";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatHours } from "@/lib/formatters";

function DayBars({ days, maxCount }) {
  return (
    <div className="space-y-2">
      {days.map((day) => (
        <div key={day.day} className="flex items-center gap-3">
          <span className="w-20 text-xs font-medium text-text-secondary">
            {day.day.slice(0, 3)}
          </span>
          <div className="flex-1">
            <div className="h-5 overflow-hidden rounded-button bg-background">
              <div
                className="flex h-full items-center rounded-button bg-primary/80 px-2 text-xs font-medium text-white"
                style={{
                  width: `${Math.max(
                    (day.completed_count / maxCount) * 100,
                    day.completed_count > 0 ? 10 : 0
                  )}%`,
                }}
              >
                {day.completed_count > 0 ? day.completed_count : ""}
              </div>
            </div>
          </div>
          <span className="w-14 text-right text-xs text-text-muted">
            {formatHours(day.total_hours)}h
          </span>
        </div>
      ))}
    </div>
  );
}

export function WeekdayBreakdown({ data, loading }) {
  const totals = data?.totals || [];
  const developers = data?.developers || [];
  const maxCount = Math.max(
    ...totals.map((d) => d.completed_count),
    ...developers.flatMap((d) => d.days.map((day) => day.completed_count)),
    1
  );

  return (
    <Card>
      <h2 className="text-tagline font-semibold text-text-primary">
        {dashboardData.weekday.title}
      </h2>
      <p className="mb-4 text-sm text-text-secondary">{dashboardData.weekday.subtitle}</p>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      ) : developers.length === 0 ? (
        <EmptyState
          title={dashboardData.weekday.noDevelopers}
          description=""
        />
      ) : (
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-semibold text-text-primary">
              {dashboardData.weekday.teamTotal}
            </p>
            <DayBars days={totals} maxCount={maxCount} />
          </div>

          {developers.map((developer) => (
            <div
              key={developer.id}
              className="rounded-button border border-border-light bg-background/50 p-4"
            >
              <p className="mb-3 text-sm font-semibold text-text-primary">
                {developer.full_name}
              </p>
              <DayBars days={developer.days} maxCount={maxCount} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
