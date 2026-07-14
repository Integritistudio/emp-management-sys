"use client";

import { Pause, Play, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { commonData } from "@/data/common";

function TimerActionButton({ label, onClick, disabled, children }) {
  return (
    <Tooltip content={label}>
      <Button
        variant="ghost"
        className="px-2 py-1.5"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
      >
        {children}
      </Button>
    </Tooltip>
  );
}

export function TaskTimerActions({ task, onPause, onResume, onComplete, loading }) {
  if (!task || ["completed", "cancelled"].includes(task.status)) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {task.status === "paused" || task.status === "on_hold" ? (
        <TimerActionButton
          label={commonData.actions.resume}
          onClick={() => onResume(task)}
          disabled={loading}
        >
          <Play className="h-4 w-4 text-success" />
        </TimerActionButton>
      ) : ["in_progress"].includes(task.status) ? (
        <TimerActionButton
          label={commonData.actions.pause}
          onClick={() => onPause(task)}
          disabled={loading}
        >
          <Pause className="h-4 w-4 text-warning" />
        </TimerActionButton>
      ) : null}
      <TimerActionButton
        label={commonData.actions.complete}
        onClick={() => onComplete(task)}
        disabled={loading}
      >
        <CheckCircle className="h-4 w-4 text-success" />
      </TimerActionButton>
    </div>
  );
}
