"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dashboardData } from "@/data/dashboard";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatHours } from "@/lib/formatters";

const COMPLETED_COLOR = "#004d4d";
const HOURS_COLOR = "#706fd3";

const EMPTY_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
  (day, index) => ({
    day,
    day_index: index + 1,
    completed_count: 0,
    total_hours: 0,
  })
);

function WeekdayTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const label = payload[0]?.payload?.fullDay || payload[0]?.payload?.day || "";
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-sm">
      <p className="mb-1.5 text-sm font-semibold text-text-primary">{label}</p>
      {payload.map((item) => (
        <p
          key={item.dataKey}
          className="flex items-center gap-2 text-xs text-text-secondary"
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.name}:{" "}
          <span className="font-medium text-text-primary">
            {item.dataKey === "hours"
              ? `${formatHours(item.value)}h`
              : item.value}
          </span>
        </p>
      ))}
    </div>
  );
}

export function WeekdayBreakdown({ data, loading, developersList = [] }) {
  const developers = data?.developers || [];
  const totals = data?.totals || [];
  const mode = data?.mode || "weekday";
  const isDaily = mode === "daily";
  const [selectedId, setSelectedId] = useState("team");

  const dropdownDevelopers = useMemo(() => {
    const byId = new Map();
    developers.forEach((d) => byId.set(d.id, d));
    developersList.forEach((d) => {
      if (!byId.has(d.id)) {
        byId.set(d.id, {
          id: d.id,
          full_name: d.full_name,
          days: totals.length
            ? totals.map((day) => ({
                ...day,
                completed_count: 0,
                total_hours: 0,
              }))
            : EMPTY_WEEK,
        });
      }
    });
    return Array.from(byId.values()).sort((a, b) =>
      a.full_name.localeCompare(b.full_name)
    );
  }, [developers, developersList, totals]);

  const chartData = useMemo(() => {
    const sourceDays =
      selectedId === "team"
        ? totals
        : dropdownDevelopers.find((d) => d.id === selectedId)?.days ||
          totals.map((day) => ({
            ...day,
            completed_count: 0,
            total_hours: 0,
          }));

    return sourceDays.map((day) => ({
      day: isDaily
        ? day.day
        : String(day.day || "").slice(0, 3),
      fullDay: day.day,
      completed: day.completed_count || 0,
      hours: Number(day.total_hours || 0),
    }));
  }, [selectedId, totals, dropdownDevelopers, isDaily]);

  const selectedLabel =
    selectedId === "team"
      ? dashboardData.weekday.teamTotal
      : dropdownDevelopers.find((d) => d.id === selectedId)?.full_name ||
        dashboardData.weekday.teamTotal;

  const title = isDaily
    ? dashboardData.weekday.dailyTitle
    : dashboardData.weekday.title;
  const subtitle = isDaily
    ? dashboardData.weekday.dailySubtitle
    : dashboardData.weekday.subtitle;

  const hasAnyActivity =
    totals.some((d) => d.completed_count > 0) || dropdownDevelopers.length > 0;

  const manyPoints = chartData.length > 14;
  const tickInterval = manyPoints ? Math.ceil(chartData.length / 10) - 1 : 0;

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-tagline font-semibold text-text-primary">
            {title}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
        </div>
        {!loading && dropdownDevelopers.length > 0 ? (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-10 max-w-[240px] rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus:border-primary focus:outline-none"
            aria-label={dashboardData.weekday.byDeveloper}
          >
            <option value="team">{dashboardData.weekday.teamTotal}</option>
            {dropdownDevelopers.map((dev) => (
              <option key={dev.id} value={dev.id}>
                {dev.full_name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {loading ? (
        <Skeleton className="h-72 rounded-card" />
      ) : !hasAnyActivity ? (
        <EmptyState
          title={dashboardData.weekday.noDevelopers}
          description=""
        />
      ) : (
        <div>
          <p className="mb-3 text-sm font-medium text-text-primary">
            {selectedLabel}
            {isDaily && totals.length ? (
              <span className="ml-2 text-xs font-normal text-text-muted">
                ({totals.length} days)
              </span>
            ) : null}
          </p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 8, right: 12, left: 0, bottom: manyPoints ? 24 : 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="day"
                  interval={tickInterval}
                  angle={manyPoints ? -35 : 0}
                  textAnchor={manyPoints ? "end" : "middle"}
                  height={manyPoints ? 50 : 30}
                  tick={{ fontSize: manyPoints ? 10 : 12, fill: "#454545" }}
                />
                <YAxis
                  yAxisId="left"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#7a7a7a" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#7a7a7a" }}
                />
                <Tooltip content={<WeekdayTooltip />} />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="completed"
                  name={dashboardData.weekday.completed}
                  fill={COMPLETED_COLOR}
                  radius={[4, 4, 0, 0]}
                  barSize={isDaily ? Math.max(8, Math.min(22, 420 / chartData.length)) : 28}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="hours"
                  name={dashboardData.weekday.hours}
                  stroke={HOURS_COLOR}
                  strokeWidth={2.5}
                  dot={{ r: isDaily ? 2 : 4, fill: HOURS_COLOR }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs text-text-muted">
            {isDaily
              ? "Each bar is completions that landed on that calendar day (completion date, or update/create date if missing). Purple line = hours logged. This can differ slightly from “Total Tasks − Active” if some tasks have no completion timestamp history."
              : "Week view uses Monday–Friday. Green bars = completed tasks · Purple line = hours logged."}
          </p>
        </div>
      )}
    </Card>
  );
}
