"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { teamApi } from "@/lib/team";
import { extractDistinctTitles } from "@/lib/teamFilters";
import { fetchCached, invalidateCache } from "@/lib/requestCache";

function serializeParams(params = {}) {
  return JSON.stringify({
    sort: params.sort || "",
  });
}

export function useTeam(initialParams = {}) {
  const [members, setMembers] = useState([]);
  const [titleOptions, setTitleOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  const paramsKey = serializeParams(initialParams);

  const fetchMembers = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setError("");
    setLoading(true);

    try {
      const parsed = JSON.parse(paramsKey);
      const response = await fetchCached(`team:${paramsKey}`, () =>
        teamApi.getAll({ sort: parsed.sort || undefined })
      );

      if (requestId !== requestIdRef.current) return;

      const list = response.data || [];
      const titles = response.titles?.length
        ? response.titles
        : extractDistinctTitles(list);

      setMembers(list);
      setTitleOptions(titles);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [paramsKey]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    titleOptions,
    loading,
    error,
    refresh: fetchMembers,
    createMember: async (data) => {
      await teamApi.create(data);
      invalidateCache("team:");
      await fetchMembers();
    },
    updateMember: async (id, data) => {
      await teamApi.update(id, data);
      invalidateCache("team:");
      await fetchMembers();
    },
    deleteMember: async (id) => {
      await teamApi.delete(id);
      invalidateCache("team:");
      await fetchMembers();
    },
  };
}

export function useTeamMember(id) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  const fetchMember = useCallback(
    async ({ silent = false } = {}) => {
      if (!id) return;
      const requestId = ++requestIdRef.current;
      if (!silent) {
        setError("");
        setLoading(true);
      }

      try {
        const response = await teamApi.getById(id);
        if (requestId !== requestIdRef.current) return;

        const payload = response.data || {};
        setMember({
          ...payload,
          tasks: Array.isArray(payload.tasks) ? payload.tasks : [],
          projects: Array.isArray(payload.projects) ? payload.projects : [],
        });
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(err.message);
      } finally {
        if (requestId === requestIdRef.current && !silent) {
          setLoading(false);
        }
      }
    },
    [id]
  );

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  useEffect(() => {
    const onFocus = () => fetchMember({ silent: true });
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchMember]);

  return {
    member,
    loading,
    error,
    refresh: fetchMember,
    updateMember: async (data) => {
      await teamApi.update(id, data);
      await fetchMember({ silent: true });
    },
    deleteMember: async () => {
      await teamApi.delete(id);
    },
  };
}
