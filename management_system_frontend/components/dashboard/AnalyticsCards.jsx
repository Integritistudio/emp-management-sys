"use client";

import { dashboardData } from "@/data/dashboard";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export function AnalyticsCards({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {dashboardData.analyticsCards.map((card) => (
        <Card key={card.key} className="!p-5">
          <p className="metric-label">{card.label}</p>
          <p className="metric-value">{stats?.[card.key] ?? 0}</p>
        </Card>
      ))}
    </div>
  );
}
