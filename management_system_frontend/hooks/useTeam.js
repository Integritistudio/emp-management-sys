"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { teamApi } from "@/lib/team";
import { extractDistinctTitles } from "@/lib/teamFilters";

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
      const response = await teamApi.getAll({ sort: parsed.sort || undefined });

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
      await fetchMembers();
    },
    updateMember: async (id, data) => {
      await teamApi.update(id, data);
      await fetchMembers();
    },
    deleteMember: async (id) => {
      await teamApi.delete(id);
      await fetchMembers();
    },
  };
}
