"use client";

import { useEffect, useState } from "react";
import { teamData } from "@/data/team";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { hasErrors, isValidEmail, required } from "@/lib/formValidation";

const emptyForm = {
  title: "",
  full_name: "",
  email: "",
};

export function TeamMemberForm({ member, onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

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
    setFieldErrors({});
    setError("");
  }, [member]);

  const handleChange = (field) => (e) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validate = () => {
    const errors = {
      title: required(form.title, "Title is required"),
      full_name: required(form.full_name, "Full name is required"),
      email:
        required(form.email, "Email is required") ||
        (!isValidEmail(form.email) ? "Please enter a valid email address" : ""),
    };
    setFieldErrors(errors);
    return !hasErrors(errors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

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
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
        error={fieldErrors.title}
      />
      <Input
        id="full_name"
        label={teamData.form.nameLabel}
        placeholder={teamData.form.namePlaceholder}
        value={form.full_name}
        onChange={handleChange("full_name")}
        error={fieldErrors.full_name}
      />
      <Input
        id="email"
        type="email"
        label={teamData.form.emailLabel}
        placeholder={teamData.form.emailPlaceholder}
        value={form.email}
        onChange={handleChange("email")}
        error={fieldErrors.email}
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
