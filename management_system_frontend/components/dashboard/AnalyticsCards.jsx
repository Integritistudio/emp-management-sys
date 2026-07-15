"use client";

import {
  Briefcase,
  CheckCircle2,
  ClipboardList,
  PauseCircle,
  PlayCircle,
  Users,
} from "lucide-react";
import { dashboardData } from "@/data/dashboard";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

const ICONS = {
  totalTasks: ClipboardList,
  completedTasks: CheckCircle2,
  activeTasks: PlayCircle,
  onHoldTasks: PauseCircle,
  activeProjects: Briefcase,
  engagedEmployees: Users,
};

const ACCENTS = {
  teal: {
    icon: "bg-teal-50 text-teal-700",
    bar: "bg-teal-600",
  },
  green: {
    icon: "bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-600",
  },
  blue: {
    icon: "bg-blue-50 text-blue-700",
    bar: "bg-blue-600",
  },
  amber: {
    icon: "bg-amber-50 text-amber-700",
    bar: "bg-amber-500",
  },
  violet: {
    icon: "bg-violet-50 text-violet-700",
    bar: "bg-violet-600",
  },
  rose: {
    icon: "bg-rose-50 text-rose-700",
    bar: "bg-rose-500",
  },
};

export function AnalyticsCards({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {dashboardData.analyticsCards.map((card) => {
        const Icon = ICONS[card.key] || ClipboardList;
        const accent = ACCENTS[card.accent] || ACCENTS.teal;
        const value = stats?.[card.key] ?? 0;

        return (
          <Card
            key={card.key}
            className="relative overflow-hidden !p-5 transition-colors hover:bg-surface-pearl"
          >
            <div className={`absolute inset-x-0 top-0 h-1 ${accent.bar}`} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="metric-label">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">
                  {value}
                </p>
              </div>
              <span
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent.icon}`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
            </div>
            {card.hint ? (
              <p className="mt-3 text-xs text-text-muted">{card.hint}</p>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
