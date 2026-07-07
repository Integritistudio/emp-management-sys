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
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { reportsData } from "@/data/reports";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatLabel } from "@/lib/formatters";

const CHART_COLORS = [
  "#1a56db",
  "#3b82f6",
  "#0e7490",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
];

function ChartCard({ title, children, loading }) {
  return (
    <Card className="!p-4">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">{title}</h3>
      {loading ? (
        <Skeleton className="h-56 rounded-card" />
      ) : (
        <div className="h-56">{children}</div>
      )}
    </Card>
  );
}

export function ReportCharts({ charts, loading }) {
  const tasksCompletedBar = charts?.tasksCompletedBar || [];
  const activityLine = charts?.activityLine || [];
  const statusPie = (charts?.statusPie || []).map((item) => ({
    ...item,
    name: formatLabel(item.name),
  }));
  const hoursArea = charts?.hoursArea || [];
  const efficiencyBar = charts?.efficiencyBar || [];
  const priorityPie = (charts?.priorityPie || []).map((item) => ({
    ...item,
    name: formatLabel(item.name),
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title={reportsData.charts.tasksCompletedBar} loading={loading}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={tasksCompletedBar}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#1a56db" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={reportsData.charts.activityLine} loading={loading}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={activityLine}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="#1a56db"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="#0e7490"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={reportsData.charts.statusPie} loading={loading}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusPie}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {statusPie.map((_, index) => (
                <Cell
                  key={index}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={reportsData.charts.hoursArea} loading={loading}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={hoursArea}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="#1a56db"
              fill="#93c5fd"
              fillOpacity={0.4}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={reportsData.charts.efficiencyBar} loading={loading}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={efficiencyBar} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="efficiency" fill="#0e7490" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={reportsData.charts.priorityPie} loading={loading}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={priorityPie}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {priorityPie.map((_, index) => (
                <Cell
                  key={index}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
