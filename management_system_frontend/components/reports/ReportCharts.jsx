"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { reportsData } from "@/data/reports";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatLabel } from "@/lib/formatters";

/** Distinct palette — one color per developer / category */
const DEV_COLORS = [
  "#1a56db", // blue
  "#059669", // green
  "#d97706", // amber
  "#dc2626", // red
  "#7c3aed", // purple
  "#0891b2", // cyan
  "#db2777", // pink
  "#4f46e5", // indigo
];

const EST_COLOR = "#2563eb"; // blue — estimated
const ACT_COLOR = "#ea580c"; // orange — actual (high contrast)

const WORKLOAD = {
  completed: "#16a34a",
  active: "#1a56db",
  other: "#94a3b8",
};

const STATUS_COLORS = {
  completed: "#16a34a",
  in_progress: "#1a56db",
  paused: "#d97706",
  on_hold: "#7c3aed",
  not_started: "#94a3b8",
  cancelled: "#dc2626",
};

const COMPLEXITY_COLORS = {
  low: "#16a34a",
  medium: "#d97706",
  high: "#dc2626",
};

const ASSIGNED_COLOR = "#7c3aed"; // purple — like reference
const COMPLETED_LINE = "#16a34a"; // green — like reference

function WeeklyProductivityTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  const assigned = payload.find((p) => p.dataKey === "assigned");
  const completed = payload.find((p) => p.dataKey === "completed");
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-sm">
      <p className="mb-1.5 text-sm font-semibold text-text-primary">
        {row.hoverLabel || row.xLabel || "Day"}
      </p>
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-xs text-text-secondary">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: ASSIGNED_COLOR }}
          />
          Assigned:{" "}
          <span className="font-medium text-text-primary">
            {assigned?.value ?? 0}
          </span>
        </p>
        <p className="flex items-center gap-2 text-xs text-text-secondary">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: COMPLETED_LINE }}
          />
          Completed:{" "}
          <span className="font-medium text-text-primary">
            {completed?.value ?? 0}
          </span>
        </p>
      </div>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  background: "#fff",
  fontSize: 12,
};

function colorFor(index) {
  return DEV_COLORS[index % DEV_COLORS.length];
}

function ChartCard({ title, hint, children, loading, tall, extraTall }) {
  const heightClass = extraTall ? "h-[28rem]" : tall ? "h-80" : "h-72";
  return (
    <Card className="!p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {hint ? (
          <p className="mt-0.5 text-xs text-text-muted">{hint}</p>
        ) : null}
      </div>
      {loading ? (
        <Skeleton className={`${heightClass} rounded-card`} />
      ) : (
        <div className={heightClass}>{children}</div>
      )}
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-text-muted">
      No chart data for this period
    </div>
  );
}

/** Color key under a chart */
function ColorLegend({ items }) {
  if (!items?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-border-light pt-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 shrink-0 rounded-sm"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          <span className="text-xs text-text-secondary">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function shortName(name) {
  if (!name) return "—";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 12);
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export function ReportCharts({ charts, loading, period = "week" }) {
  const tasksCompletedBar = charts?.tasksCompletedBar || [];
  const estimatedVsActual = charts?.estimatedVsActual || [];
  const varianceByDeveloper = (charts?.varianceByDeveloper || []).map((row, i) => ({
    ...row,
    fill: colorFor(i),
  }));
  const projectWorkload = (charts?.projectWorkload || []).map((row) => {
    const other = Math.max(
      0,
      Number(row.total || 0) - Number(row.completed || 0) - Number(row.active || 0)
    );
    return {
      ...row,
      other,
      label: shortName(row.name),
    };
  });

  const productivityTitle =
    period === "month"
      ? reportsData.charts.productivityMonth
      : period === "custom"
        ? reportsData.charts.productivityCustom
        : reportsData.charts.productivityWeek;

  const productivityHint =
    period === "month"
      ? "Purple = tasks assigned · Green = tasks completed each day this month"
      : period === "custom"
        ? "Purple = tasks assigned · Green = tasks completed each day in the selected range"
        : "Purple = tasks assigned · Green = tasks completed (by day this week)";

  const weeklyTrend = (charts?.weeklyTrend || []).map((row) => {
    const date = row.date ? new Date(`${row.date}T12:00:00`) : null;
    const valid = date && !Number.isNaN(date.getTime());
    const dayName = valid
      ? date.toLocaleDateString(undefined, { weekday: "short" })
      : row.day || "—";
    const monthDay = valid
      ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "";
    const hoverLabel = valid
      ? date.toLocaleDateString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : dayName;

    // Week: "Mon 13" · Month/custom: "Jul 13" (avoids many duplicate Mon/Tue labels)
    const xLabel =
      period === "week"
        ? `${dayName} ${valid ? date.getDate() : ""}`.trim()
        : monthDay || dayName;

    return {
      ...row,
      assigned: Number(row.assigned || 0),
      completed: Number(row.completed || 0),
      xLabel,
      hoverLabel,
    };
  });
  const hasWeeklyActivity = weeklyTrend.some(
    (row) => Number(row.assigned) > 0 || Number(row.completed) > 0
  );
  const complexityBreakdown = (charts?.complexityBreakdown || []).map((item) => {
    const key = String(item.name || "").toLowerCase();
    return {
      ...item,
      name: formatLabel(item.name),
      fill: COMPLEXITY_COLORS[key] || colorFor(0),
    };
  });
  const statusPie = (charts?.statusPie || []).map((item) => {
    const key = String(item.name || "").toLowerCase();
    return {
      ...item,
      raw: item.name,
      name: formatLabel(item.name),
      fill: STATUS_COLORS[key] || colorFor(0),
    };
  });
  const efficiencyBar = (charts?.efficiencyBar || []).map((row, i) => ({
    ...row,
    label: `${shortName(row.name)} (${Number(row.efficiency || 0).toFixed(0)}%)`,
    fill: colorFor(i),
  }));

  const completionLegend = tasksCompletedBar.map((row, i) => ({
    label: row.name,
    color: colorFor(i),
  }));
  const varianceLegend = varianceByDeveloper.map((row) => ({
    label: row.name,
    color: row.fill,
  }));
  const efficiencyLegend = efficiencyBar.map((row) => ({
    label: row.name,
    color: row.fill,
  }));

  const complexityTotal = complexityBreakdown.reduce((s, i) => s + i.value, 0);
  const complexityWithPct = complexityBreakdown.map((item) => ({
    ...item,
    pct: complexityTotal ? Math.round((item.value / complexityTotal) * 100) : 0,
  }));

  const statusTotal = statusPie.reduce((s, i) => s + i.value, 0);

  return (
    <div className="mb-2">
      <h2 className="mb-4 text-tagline font-semibold text-text-primary">
        Visual Analytics
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 1. Task completion — unique color per developer + legend */}
        <ChartCard
          title={reportsData.charts.tasksCompletedBar}
          hint="How many tasks each developer finished in this period"
          loading={loading}
          tall
        >
          {!loading && !tasksCompletedBar.length ? (
            <EmptyChart />
          ) : (
            <div className="flex h-full flex-col">
              <div className="min-h-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tasksCompletedBar}
                    margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" hide />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      label={{
                        value: "Tasks completed",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 11, fill: "#64748b" },
                      }}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => [value, "Completed tasks"]}
                      labelFormatter={(label) => label}
                    />
                    <Bar dataKey="value" name="Completed" radius={[6, 6, 0, 0]} maxBarSize={56}>
                      {tasksCompletedBar.map((_, i) => (
                        <Cell key={i} fill={colorFor(i)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ColorLegend items={completionLegend} />
            </div>
          )}
        </ChartCard>

        {/* 2. Estimated vs Actual — contrasting colors, tight bar pairs */}
        <ChartCard
          title={reportsData.charts.estimatedVsActual}
          hint="Blue = planned hours · Orange = hours actually used (per developer)"
          loading={loading}
          tall
        >
          {!loading && !estimatedVsActual.length ? (
            <EmptyChart />
          ) : (
            <div className="flex h-full flex-col">
              <div className="min-h-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={estimatedVsActual}
                    margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
                    barCategoryGap="22%"
                    barGap={2}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={48}
                      tickFormatter={shortName}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      label={{
                        value: "Hours",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 11, fill: "#64748b" },
                      }}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value, name) => [
                        `${Number(value).toFixed(2)} hrs`,
                        name,
                      ]}
                    />
                    <Legend verticalAlign="top" height={28} />
                    <Bar
                      dataKey="estimated"
                      name="Estimated"
                      fill={EST_COLOR}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                    <Bar
                      dataKey="actual"
                      name="Actual"
                      fill={ACT_COLOR}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ColorLegend
                items={[
                  { label: "Estimated hours", color: EST_COLOR },
                  { label: "Actual hours", color: ACT_COLOR },
                ]}
              />
            </div>
          )}
        </ChartCard>

        {/* 3. Variance — vertical bars, unique colors */}
        <ChartCard
          title={reportsData.charts.varianceByDeveloper}
          hint="Positive = took longer than estimate · Negative = finished faster"
          loading={loading}
          tall
        >
          {!loading && !varianceByDeveloper.length ? (
            <EmptyChart />
          ) : (
            <div className="flex h-full flex-col">
              <div className="min-h-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={varianceByDeveloper}
                    margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" hide />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      label={{
                        value: "Variance (hours)",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 11, fill: "#64748b" },
                      }}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => [
                        `${Number(value) > 0 ? "+" : ""}${Number(value).toFixed(2)} hrs`,
                        "Variance",
                      ]}
                    />
                    <Bar dataKey="variance" name="Variance" radius={[6, 6, 0, 0]} maxBarSize={56}>
                      {varianceByDeveloper.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ColorLegend items={varianceLegend} />
            </div>
          )}
        </ChartCard>

        {/* 4. Project workload — stacked composition */}
        <ChartCard
          title={reportsData.charts.projectWorkload}
          hint="Each bar = one project. Green finished · Blue currently active · Grey other statuses"
          loading={loading}
          tall
        >
          {!loading && !projectWorkload.length ? (
            <EmptyChart />
          ) : (
            <div className="flex h-full flex-col">
              <div className="min-h-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={projectWorkload}
                    margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
                    barCategoryGap="18%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={48}
                      tickFormatter={shortName}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      label={{
                        value: "Number of tasks",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 11, fill: "#64748b" },
                      }}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value, name) => [value, name]}
                      labelFormatter={(label, payload) => {
                        const row = payload?.[0]?.payload;
                        if (!row) return label;
                        return `${row.name} · ${row.hours?.toFixed?.(1) ?? row.hours} hrs logged`;
                      }}
                    />
                    <Legend verticalAlign="top" height={28} />
                    <Bar
                      dataKey="completed"
                      name="Completed"
                      stackId="workload"
                      fill={WORKLOAD.completed}
                      radius={[0, 0, 0, 0]}
                      maxBarSize={48}
                    />
                    <Bar
                      dataKey="active"
                      name="Active / In progress"
                      stackId="workload"
                      fill={WORKLOAD.active}
                      maxBarSize={48}
                    />
                    <Bar
                      dataKey="other"
                      name="Other (paused / hold / etc.)"
                      stackId="workload"
                      fill={WORKLOAD.other}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ColorLegend
                items={[
                  { label: "Completed", color: WORKLOAD.completed },
                  { label: "Active", color: WORKLOAD.active },
                  { label: "Other statuses", color: WORKLOAD.other },
                ]}
              />
            </div>
          )}
        </ChartCard>

        {/* 5. Productivity trend — dual line; title follows period filter */}
        <ChartCard
          title={productivityTitle}
          hint={productivityHint}
          loading={loading}
          tall
        >
          {!loading && (!weeklyTrend.length || !hasWeeklyActivity) ? (
            <EmptyChart />
          ) : (
            <div className="flex h-full flex-col">
              <div className="min-h-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={weeklyTrend}
                    margin={{ top: 12, right: 16, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="0"
                      stroke="#f1f5f9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="xLabel"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      interval={
                        weeklyTrend.length > 14
                          ? Math.ceil(weeklyTrend.length / 8) - 1
                          : 0
                      }
                      angle={weeklyTrend.length > 10 ? -30 : 0}
                      textAnchor={weeklyTrend.length > 10 ? "end" : "middle"}
                      height={weeklyTrend.length > 10 ? 48 : 28}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip
                      content={<WeeklyProductivityTooltip />}
                      cursor={{
                        stroke: "#cbd5e1",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="assigned"
                      name="Assigned"
                      stroke={ASSIGNED_COLOR}
                      strokeWidth={2.5}
                      dot={{
                        r: 4,
                        fill: ASSIGNED_COLOR,
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        fill: ASSIGNED_COLOR,
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stroke={COMPLETED_LINE}
                      strokeWidth={2.5}
                      dot={{
                        r: 4,
                        fill: COMPLETED_LINE,
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        fill: COMPLETED_LINE,
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center justify-center gap-6 border-t border-border-light pt-3">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <span className="relative flex h-2.5 w-6 items-center">
                    <span
                      className="absolute inset-x-0 h-0.5 rounded-full"
                      style={{ backgroundColor: ASSIGNED_COLOR }}
                    />
                    <span
                      className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-white"
                      style={{ backgroundColor: ASSIGNED_COLOR }}
                    />
                  </span>
                  Assigned
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <span className="relative flex h-2.5 w-6 items-center">
                    <span
                      className="absolute inset-x-0 h-0.5 rounded-full"
                      style={{ backgroundColor: COMPLETED_LINE }}
                    />
                    <span
                      className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-white"
                      style={{ backgroundColor: COMPLETED_LINE }}
                    />
                  </span>
                  Completed
                </div>
              </div>
            </div>
          )}
        </ChartCard>

        {/* 6. Complexity — donut + readable side list */}
        <ChartCard
          title={reportsData.charts.complexityBreakdown}
          hint="Share of tasks by complexity (Low / Medium / High)"
          loading={loading}
          tall
        >
          {!loading && !complexityWithPct.length ? (
            <EmptyChart />
          ) : (
            <div className="flex h-full gap-2">
              <div className="min-w-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={complexityWithPct}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={84}
                      paddingAngle={4}
                    >
                      {complexityWithPct.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value, name, props) => [
                        `${value} tasks (${props.payload.pct}%)`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex w-36 shrink-0 flex-col justify-center gap-3">
                {complexityWithPct.map((item) => (
                  <div key={item.name} className="flex items-start gap-2">
                    <span
                      className="mt-1 inline-block h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: item.fill }}
                    />
                    <div>
                      <p className="text-xs font-semibold text-text-primary">
                        {item.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {item.value} tasks · {item.pct}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* 7. Status distribution */}
        <ChartCard
          title={reportsData.charts.statusPie}
          hint="How tasks are split across statuses right now in this period"
          loading={loading}
          tall
        >
          {!loading && !statusPie.length ? (
            <EmptyChart />
          ) : (
            <div className="flex h-full gap-2">
              <div className="min-w-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={82}
                      paddingAngle={3}
                    >
                      {statusPie.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value, name) => [
                        `${value} tasks (${
                          statusTotal
                            ? Math.round((Number(value) / statusTotal) * 100)
                            : 0
                        }%)`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex w-40 shrink-0 flex-col justify-center gap-2.5">
                {statusPie.map((item) => (
                  <div key={item.name} className="flex items-start gap-2">
                    <span
                      className="mt-1 inline-block h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: item.fill }}
                    />
                    <div>
                      <p className="text-xs font-semibold text-text-primary">
                        {item.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {item.value} ·{" "}
                        {statusTotal
                          ? Math.round((item.value / statusTotal) * 100)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* 8. Efficiency — vertical bars with name + % */}
        <ChartCard
          title={reportsData.charts.efficiencyBar}
          hint="Higher % = better (completed closer to or under estimate). Label = Developer (efficiency %)"
          loading={loading}
          tall
        >
          {!loading && !efficiencyBar.length ? (
            <EmptyChart />
          ) : (
            <div className="flex h-full flex-col">
              <div className="min-h-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={efficiencyBar}
                    margin={{ top: 8, right: 8, left: 0, bottom: 56 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      interval={0}
                      angle={-22}
                      textAnchor="end"
                      height={56}
                    />
                    <YAxis
                      domain={[0, "auto"]}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      label={{
                        value: "Efficiency %",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 11, fill: "#64748b" },
                      }}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value, _name, props) => [
                        `${Number(value).toFixed(1)}%`,
                        props.payload.name,
                      ]}
                      labelFormatter={() => "Efficiency"}
                    />
                    <Bar dataKey="efficiency" name="Efficiency %" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {efficiencyBar.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ColorLegend items={efficiencyLegend} />
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
