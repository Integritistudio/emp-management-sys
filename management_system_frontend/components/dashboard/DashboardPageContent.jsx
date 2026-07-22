"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { dashboardData } from "@/data/dashboard";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuthContext } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { AnalyticsCards } from "./AnalyticsCards";
import { TeamPerformanceTable } from "./TeamPerformanceTable";
import { WeekdayBreakdown } from "./WeekdayBreakdown";
import { TeamMatrix } from "./TeamMatrix";

export function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMember, user } = useAuthContext();
  const [period, setPeriod] = useState(searchParams.get("period") || "week");
  const [startDate, setStartDate] = useState(
    searchParams.get("startDate") || ""
  );
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");

  const customReady =
    period !== "custom" || Boolean(startDate && endDate);

  const params = useMemo(() => {
    if (period === "custom") {
      if (!startDate || !endDate) {
        return { period: "week" };
      }
      return { period: "custom", startDate, endDate };
    }
    return { period };
  }, [period, startDate, endDate]);

  const {
    stats,
    teamPerformance,
    weekdayBreakdown,
    matrix,
    loading,
    error,
    refresh,
  } = useDashboard(params, { memberMode: isMember });

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

  const subtitle = isMember
    ? dashboardData.memberSubtitle
    : dashboardData.subtitle;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="heading-page">{dashboardData.pageTitle}</h1>
          <p className="text-subtitle">{subtitle}</p>
          {isMember && user?.full_name ? (
            <p className="mt-1 text-sm text-text-secondary">
              {dashboardData.welcome}, {user.full_name}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
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
                <label className="flex flex-col gap-1 text-xs font-medium text-text-secondary">
                  {dashboardData.filters.startDate}
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-11 rounded-md border border-border bg-surface px-3 text-sm text-body focus:border-primary focus:outline-none focus:outline-2 focus:outline-offset-0 focus:outline-primary-focus"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-text-secondary">
                  {dashboardData.filters.endDate}
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-11 rounded-md border border-border bg-surface px-3 text-sm text-body focus:border-primary focus:outline-none focus:outline-2 focus:outline-offset-0 focus:outline-primary-focus"
                  />
                </label>
              </>
            ) : null}
          </div>
          {period === "custom" && !customReady ? (
            <p className="text-xs text-warning">
              {dashboardData.filters.customHint}
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-button border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <section>
        <AnalyticsCards stats={stats} loading={loading} memberMode={isMember} />
      </section>

      {!isMember ? (
        <>
          <section className="grid gap-6 xl:grid-cols-2">
            <TeamPerformanceTable data={teamPerformance} loading={loading} />
            <WeekdayBreakdown
              data={weekdayBreakdown}
              loading={loading}
              developersList={teamPerformance}
            />
          </section>

          <section>
            <TeamMatrix matrix={matrix} loading={loading} onUpdated={refresh} />
          </section>
        </>
      ) : null}
    </div>
  );
}
