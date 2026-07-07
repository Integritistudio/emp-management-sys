"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { dashboardData } from "@/data/dashboard";
import { useDashboard } from "@/hooks/useDashboard";
import { Button } from "@/components/ui/Button";
import { AnalyticsCards } from "./AnalyticsCards";
import { TeamPerformanceTable } from "./TeamPerformanceTable";
import { WeekdayBreakdown } from "./WeekdayBreakdown";
import { TeamMatrix } from "./TeamMatrix";

export function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [period, setPeriod] = useState(searchParams.get("period") || "week");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");

  const params = useMemo(
    () => ({
      period: period === "custom" ? "custom" : period,
      startDate: period === "custom" ? startDate || undefined : undefined,
      endDate: period === "custom" ? endDate || undefined : undefined,
    }),
    [period, startDate, endDate]
  );

  const {
    stats,
    teamPerformance,
    weekdayBreakdown,
    matrix,
    loading,
    error,
    refresh,
  } = useDashboard(params);

  const syncUrl = useCallback(() => {
    const query = new URLSearchParams();
    if (period) query.set("period", period);
    if (period === "custom" && startDate) query.set("startDate", startDate);
    if (period === "custom" && endDate) query.set("endDate", endDate);
    const qs = query.toString();
    router.replace(qs ? `/dashboard?${qs}` : "/dashboard");
  }, [period, startDate, endDate, router]);

  useEffect(() => {
    syncUrl();
  }, [syncUrl]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="heading-page">{dashboardData.pageTitle}</h1>
          <p className="text-subtitle">{dashboardData.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          {["week", "month", "custom"].map((key) => (
            <Button
              key={key}
              variant={period === key ? "primary" : "secondary"}
              onClick={() => setPeriod(key)}
            >
              {dashboardData.filters[key]}
            </Button>
          ))}
          {period === "custom" ? (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 rounded-md border border-border bg-surface px-4 text-body focus:border-primary focus:outline-none focus:outline-2 focus:outline-offset-0 focus:outline-primary-focus"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 rounded-md border border-border bg-surface px-4 text-body focus:border-primary focus:outline-none focus:outline-2 focus:outline-offset-0 focus:outline-primary-focus"
              />
            </>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-button border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <div className="mb-8">
        <AnalyticsCards stats={stats} loading={loading} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <TeamPerformanceTable data={teamPerformance} loading={loading} />
        <WeekdayBreakdown data={weekdayBreakdown} loading={loading} />
      </div>

      <TeamMatrix matrix={matrix} loading={loading} onUpdated={refresh} />
    </div>
  );
}
