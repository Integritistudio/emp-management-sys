"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { loginData } from "@/data/login";
import { navigationData } from "@/data/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import { ApiError } from "@/lib/api";
import { hasErrors, isValidEmail, required } from "@/lib/formValidation";

export default function LoginForm() {
  const { login, loading } = useAuth({ redirectTo: "/dashboard" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <PageLoader />;
  }

  const validate = () => {
    const errors = {
      email:
        required(email, "Email is required") ||
        (!isValidEmail(email) ? "Please enter a valid email address" : ""),
      password: required(password, "Password is required"),
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
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src={navigationData.brand.logo}
            alt={navigationData.brand.name}
            className="mx-auto mb-4 h-14 w-auto object-contain"
          />
          <h1 className="heading-page">{loginData.pageTitle}</h1>
          <p className="text-subtitle">{loginData.subtitle}</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-caption text-danger">
                {error}
              </div>
            ) : null}

            <Input
              id="email"
              label={loginData.emailLabel}
              type="email"
              placeholder={loginData.emailPlaceholder}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((prev) => {
                  if (!prev.email) return prev;
                  const next = { ...prev };
                  delete next.email;
                  return next;
                });
              }}
              error={fieldErrors.email}
              autoComplete="email"
            />

            <Input
              id="password"
              label={loginData.passwordLabel}
              type="password"
              placeholder={loginData.passwordPlaceholder}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((prev) => {
                  if (!prev.password) return prev;
                  const next = { ...prev };
                  delete next.password;
                  return next;
                });
              }}
              error={fieldErrors.password}
              autoComplete="current-password"
            />

            <Button type="submit" loading={submitting} className="w-full">
              {loginData.submitButton}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-text-muted">
          {loginData.footer}
        </p>
      </div>
    </div>
  );
}
