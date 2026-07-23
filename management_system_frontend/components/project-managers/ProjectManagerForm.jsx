"use client";

import { useEffect, useState } from "react";
import { projectManagersData } from "@/data/projectManagers";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { hasErrors, isValidEmail, required } from "@/lib/formValidation";

const emptyForm = {
  full_name: "",
  email: "",
  password: "",
};

export function ProjectManagerForm({ manager, onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (manager) {
      setForm({
        full_name: manager.full_name || "",
        email: manager.email || "",
        password: "",
      });
    } else {
      setForm(emptyForm);
    }
    setFieldErrors({});
    setError("");
  }, [manager]);

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
      full_name: required(form.full_name, "Full name is required"),
      email:
        required(form.email, "Email is required") ||
        (!isValidEmail(form.email) ? "Please enter a valid email address" : ""),
      password: !manager
        ? required(form.password, "Password is required") ||
          (form.password.length < 6
            ? "Password must be at least 6 characters"
            : "")
        : form.password && form.password.length < 6
          ? "Password must be at least 6 characters"
          : "",
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
      const payload = {
        full_name: form.full_name,
        email: form.email,
      };
      if (form.password.trim()) {
        payload.password = form.password.trim();
      }
      await onSubmit(payload);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to save project manager"
      );
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
        id="full_name"
        label={projectManagersData.form.nameLabel}
        placeholder={projectManagersData.form.namePlaceholder}
        value={form.full_name}
        onChange={handleChange("full_name")}
        error={fieldErrors.full_name}
      />
      <Input
        id="email"
        type="email"
        label={projectManagersData.form.emailLabel}
        placeholder={projectManagersData.form.emailPlaceholder}
        value={form.email}
        onChange={handleChange("email")}
        error={fieldErrors.email}
      />
      <Input
        id="password"
        type="password"
        label={
          manager
            ? projectManagersData.form.resetPasswordLabel
            : projectManagersData.form.passwordLabel
        }
        placeholder={projectManagersData.form.passwordPlaceholder}
        value={form.password}
        onChange={handleChange("password")}
        error={fieldErrors.password}
        autoComplete="new-password"
      />
      <p className="text-xs text-text-muted">
        {manager
          ? projectManagersData.form.passwordHintReset
          : projectManagersData.form.passwordHint}
      </p>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {projectManagersData.form.cancel}
        </Button>
        <Button type="submit" loading={submitting}>
          {projectManagersData.form.submit}
        </Button>
      </div>
    </form>
  );
}
