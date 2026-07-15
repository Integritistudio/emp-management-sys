"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { reportsData } from "@/data/reports";
import { TASK_STATUS_OPTIONS } from "@/data/tasks";
import { PROJECT_STATUS_OPTIONS } from "@/data/projects";
import { useReports } from "@/hooks/useReports";
import { useTeam } from "@/hooks/useTeam";
import { useProjects } from "@/hooks/useProjects";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/ui/FilterBar";
import { ReportSummary } from "./ReportSummary";
import { ReportCharts } from "./ReportCharts";
import {
  TeamReportTable,
  ProjectReportTable,
  DeveloperDetailPanel,
  ProjectDetailPanel,
} from "./ReportTables";
import { ExportPdfModal } from "./ExportPdfModal";
import { reportsApi } from "@/lib/reports";

export function ReportsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "team");
  const [period, setPeriod] = useState(searchParams.get("period") || "week");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  const [developerId, setDeveloperId] = useState(
    searchParams.get("developerId") || ""
  );
  const [projectId, setProjectId] = useState(searchParams.get("projectId") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [exportOpen, setExportOpen] = useState(false);

  const { members: developers } = useTeam();
  const { projects } = useProjects();

  const params = useMemo(
    () => ({
      period: period === "custom" ? "custom" : period,
      startDate: period === "custom" ? startDate || undefined : undefined,
      endDate: period === "custom" ? endDate || undefined : undefined,
      developerId: activeTab === "team" ? developerId || undefined : undefined,
      projectId: activeTab === "project" ? projectId || undefined : undefined,
      status: status || undefined,
    }),
    [period, startDate, endDate, developerId, projectId, status, activeTab]
  );

  const { data, loading, error } = useReports(activeTab, params);

  const syncUrl = useCallback(() => {
    const query = new URLSearchParams();
    query.set("tab", activeTab);
    if (period) query.set("period", period);
    if (period === "custom" && startDate) query.set("startDate", startDate);
    if (period === "custom" && endDate) query.set("endDate", endDate);
    if (developerId) query.set("developerId", developerId);
    if (projectId) query.set("projectId", projectId);
    if (status) query.set("status", status);
    router.replace(`/reports?${query.toString()}`);
  }, [activeTab, period, startDate, endDate, developerId, projectId, status, router]);

  useEffect(() => {
    syncUrl();
  }, [syncUrl]);

  const hasActiveFilters = Boolean(
    developerId ||
      projectId ||
      status ||
      (period === "custom" && (startDate || endDate))
  );

  const clearFilters = () => {
    setDeveloperId("");
    setProjectId("");
    setStatus("");
    setStartDate("");
    setEndDate("");
    setPeriod("week");
  };

  const developerOptions = developers.map((d) => ({
    value: d.id,
    label: d.full_name,
  }));

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const statusOptions =
    activeTab === "project" ? PROJECT_STATUS_OPTIONS : TASK_STATUS_OPTIONS;

  const handleExport = async (exportParams) => {
    // PDF §16 — export uses Start/End from modal; keep entity filters from page
    const body = {
      period: "custom",
      startDate: exportParams.startDate,
      endDate: exportParams.endDate,
      status: params.status,
      developerId: activeTab === "team" ? developerId || undefined : undefined,
      projectId: activeTab === "project" ? projectId || undefined : undefined,
    };
    if (activeTab === "team") {
      await reportsApi.exportTeamPdf(body);
    } else {
      await reportsApi.exportProjectPdf(body);
    }
  };

  const showTeamDetail = Boolean(developerId);
  const showProjectDetail = Boolean(projectId);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="heading-page">{reportsData.pageTitle}</h1>
          <p className="text-subtitle">{reportsData.subtitle}</p>
        </div>
        <Button onClick={() => setExportOpen(true)}>
          <Download className="h-4 w-4" />
          {reportsData.export.button}
        </Button>
      </div>

      <div className="mb-6 flex gap-2">
        {["team", "project"].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "primary" : "secondary"}
            onClick={() => {
              setActiveTab(tab);
              setDeveloperId("");
              setProjectId("");
              setStatus("");
            }}
          >
            {tab === "team" ? reportsData.tabs.team : reportsData.tabs.project}
          </Button>
        ))}
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          {["week", "month", "custom"].map((key) => (
            <Button
              key={key}
              variant={period === key ? "primary" : "secondary"}
              onClick={() => setPeriod(key)}
            >
              {reportsData.filters[key]}
            </Button>
          ))}
        </div>

        <FilterBar
          filters={[
            activeTab === "team"
              ? {
                  key: "developerId",
                  label: reportsData.filters.developer,
                  value: developerId,
                  onChange: setDeveloperId,
                  options: developerOptions,
                  placeholder: reportsData.filters.allDevelopers,
                }
              : {
                  key: "projectId",
                  label: reportsData.filters.project,
                  value: projectId,
                  onChange: setProjectId,
                  options: projectOptions,
                  placeholder: reportsData.filters.allProjects,
                },
            {
              key: "status",
              label: reportsData.filters.status,
              value: status,
              onChange: setStatus,
              options: statusOptions,
              placeholder: reportsData.filters.allStatuses,
            },
          ]}
          dateRange={
            period === "custom"
              ? {
                  startLabel: reportsData.filters.startDate,
                  endLabel: reportsData.filters.endDate,
                  startDate,
                  endDate,
                  onStartChange: setStartDate,
                  onEndChange: setEndDate,
                }
              : null
          }
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
        />
      </div>

      {error ? (
        <div className="mb-4 rounded-button border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <ReportSummary
        summary={data?.summary}
        loading={loading}
        type={activeTab}
        selectedMode={
          showTeamDetail ? "developer" : showProjectDetail ? "project" : null
        }
        selectedName={
          showTeamDetail
            ? data?.member?.full_name || ""
            : showProjectDetail
              ? data?.project?.name || ""
              : ""
        }
        entityMeta={
          showTeamDetail
            ? {
                title: data?.member?.title,
                matrix_rating: data?.member?.matrix_rating,
              }
            : showProjectDetail
              ? {
                  lead: data?.project?.lead_developer_name,
                  status: data?.project?.status,
                  quality: data?.project?.quality,
                }
              : null
        }
      />

      {activeTab === "team" ? (
        showTeamDetail ? (
          <DeveloperDetailPanel
            member={data?.member}
            developer={data?.developer}
            projects={data?.projects_worked_on}
            tasks={data?.tasks}
            loading={loading}
            hideMetricStrip
          />
        ) : (
          <TeamReportTable developers={data?.developers} loading={loading} />
        )
      ) : showProjectDetail ? (
        <ProjectDetailPanel
          project={data?.project}
          tasks={data?.tasks}
          loading={loading}
          hideMetricStrip
        />
      ) : (
        <ProjectReportTable projects={data?.projects} loading={loading} />
      )}

      <ReportCharts charts={data?.charts} loading={loading} period={period} />

      <ExportPdfModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={handleExport}
        type={activeTab}
      />
    </div>
  );
}
