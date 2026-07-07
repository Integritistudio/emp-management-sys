"use client";

import { tasksData, TASK_STATUS_OPTIONS } from "@/data/tasks";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const BULK_ACTIONS = [
  { value: "assign", label: tasksData.bulk.assign },
  { value: "change_status", label: tasksData.bulk.changeStatus },
  { value: "move_project", label: tasksData.bulk.moveProject },
  { value: "on_hold", label: tasksData.bulk.onHold },
  { value: "complete", label: tasksData.bulk.complete },
];

export function BulkActionsBar({
  selectedCount,
  action,
  value,
  developers,
  projects,
  onActionChange,
  onValueChange,
  onApply,
  onClear,
  loading,
}) {
  if (selectedCount === 0) return null;

  const valueOptions = () => {
    switch (action) {
      case "assign":
        return developers.map((d) => ({ value: d.id, label: d.full_name }));
      case "change_status":
        return TASK_STATUS_OPTIONS;
      case "move_project":
        return projects.map((p) => ({ value: p.id, label: p.name }));
      default:
        return [];
    }
  };

  const needsValue = ["assign", "change_status", "move_project"].includes(action);

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-card border border-primary/20 bg-sidebar-active/30 p-4">
      <p className="text-sm font-medium text-text-primary">
        {selectedCount} {tasksData.bulk.selected}
      </p>
      <Select
        id="bulkAction"
        label={tasksData.bulk.title}
        value={action}
        onChange={(e) => onActionChange(e.target.value)}
        options={BULK_ACTIONS}
        placeholder={tasksData.bulk.selectAction}
        className="min-w-[180px]"
      />
      {needsValue ? (
        <Select
          id="bulkValue"
          label={tasksData.bulk.selectValue}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          options={valueOptions()}
          placeholder={tasksData.bulk.selectValue}
          className="min-w-[180px]"
        />
      ) : null}
      <Button onClick={onApply} loading={loading} disabled={!action || (needsValue && !value)}>
        {tasksData.bulk.apply}
      </Button>
      <Button variant="ghost" onClick={onClear}>
        {tasksData.bulk.clear}
      </Button>
    </div>
  );
}
