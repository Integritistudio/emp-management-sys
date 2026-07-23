"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { projectsApi } from "@/lib/projects";
import { projectManagersApi } from "@/lib/projectManagers";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

export function ProjectCollaborators({
  projectId,
  ownerId,
  initialCollaborators = [],
  onChanged,
}) {
  const [collaborators, setCollaborators] = useState(initialCollaborators);
  const [managers, setManagers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCollaborators(initialCollaborators || []);
  }, [initialCollaborators]);

  useEffect(() => {
    let mounted = true;
    projectManagersApi
      .getOptions()
      .then((res) => {
        if (mounted) setManagers(res.data || []);
      })
      .catch(() => {
        if (mounted) setManagers([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const options = useMemo(() => {
    const taken = new Set([
      ...(ownerId ? [ownerId] : []),
      ...collaborators.map((c) => c.id),
    ]);
    return managers
      .filter((m) => !taken.has(m.id))
      .map((m) => ({
        value: m.id,
        label: `${m.full_name} (${m.email})`,
      }));
  }, [managers, collaborators, ownerId]);

  const handleAdd = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError("");
    try {
      const res = await projectsApi.addCollaborator(projectId, selectedId);
      setCollaborators(res.data || []);
      setSelectedId("");
      onChanged?.();
    } catch (err) {
      setError(err.message || "Failed to add collaborator");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (managerId) => {
    setLoading(true);
    setError("");
    try {
      await projectsApi.removeCollaborator(projectId, managerId);
      setCollaborators((prev) => prev.filter((c) => c.id !== managerId));
      onChanged?.();
    } catch (err) {
      setError(err.message || "Failed to remove collaborator");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-text-primary">
        Collaborators
      </h2>
      <Card className="!p-4">
        <p className="mb-4 text-sm text-text-secondary">
          Project managers added here can view and manage this project&apos;s
          data.
        </p>

        {error ? (
          <div className="mb-3 rounded-button border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Select
              id="collaborator"
              label="Add project manager"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              options={options}
              placeholder="Select a project manager"
            />
          </div>
          <Button
            onClick={handleAdd}
            loading={loading}
            disabled={!selectedId}
            className="sm:mb-0"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {collaborators.length === 0 ? (
          <p className="text-sm text-text-muted">No collaborators yet.</p>
        ) : (
          <ul className="divide-y divide-border-light">
            {collaborators.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {c.full_name}
                  </p>
                  <p className="text-xs text-text-muted">{c.email}</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => handleRemove(c.id)}
                  disabled={loading}
                  aria-label={`Remove ${c.full_name}`}
                >
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
