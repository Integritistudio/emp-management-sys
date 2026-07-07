"use client";

import { Pause, Play, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { tasksData } from "@/data/tasks";

export function TaskTimerActions({ task, onPause, onResume, onComplete, loading }) {
  if (!task || ["completed", "cancelled"].includes(task.status)) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {task.status === "paused" ? (
        <Button
          variant="ghost"
          className="px-2 py-1.5"
          onClick={() => onResume(task)}
          disabled={loading}
          title={tasksData.timer.resume}
        >
          <Play className="h-4 w-4 text-success" />
        </Button>
      ) : ["in_progress"].includes(task.status) ? (
        <Button
          variant="ghost"
          className="px-2 py-1.5"
          onClick={() => onPause(task)}
          disabled={loading}
          title={tasksData.timer.pause}
        >
          <Pause className="h-4 w-4 text-warning" />
        </Button>
      ) : null}
      <Button
        variant="ghost"
        className="px-2 py-1.5"
        onClick={() => onComplete(task)}
        disabled={loading}
        title={tasksData.timer.complete}
      >
        <CheckCircle className="h-4 w-4 text-success" />
      </Button>
    </div>
  );
}
