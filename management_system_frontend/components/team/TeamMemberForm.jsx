"use client";

import { useEffect, useState } from "react";
import { teamData } from "@/data/team";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";

const emptyForm = {
  title: "",
  full_name: "",
  email: "",
};

export function TeamMemberForm({ member, onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (member) {
      setForm({
        title: member.title || "",
        full_name: member.full_name || "",
        email: member.email || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [member]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save team member");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <div className="rounded-button border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <Input
        id="title"
        label={teamData.form.titleLabel}
        placeholder={teamData.form.titlePlaceholder}
        value={form.title}
        onChange={handleChange("title")}
        required
      />
      <Input
        id="full_name"
        label={teamData.form.nameLabel}
        placeholder={teamData.form.namePlaceholder}
        value={form.full_name}
        onChange={handleChange("full_name")}
        required
      />
      <Input
        id="email"
        type="email"
        label={teamData.form.emailLabel}
        placeholder={teamData.form.emailPlaceholder}
        value={form.email}
        onChange={handleChange("email")}
        required
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {teamData.form.cancel}
        </Button>
        <Button type="submit" loading={submitting}>
          {teamData.form.submit}
        </Button>
      </div>
    </form>
  );
}
