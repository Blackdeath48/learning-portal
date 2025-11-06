"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus("Signing in...");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Invalid credentials" }));
        setStatus(error.message ?? "Invalid credentials");
        setLoading(false);
        return;
      }

      const data = (await response.json()) as {
        token?: string;
        user: { id: string; email: string; name?: string | null; role: "ADMIN" | "LEARNER" };
      };

      if (!data.token) {
        setStatus("Missing token. Ensure JWT_SECRET is configured.");
        setLoading(false);
        return;
      }

      login(data.token, data.user);
      setStatus("Success");
      router.push(data.user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (error) {
      console.error(error);
      setStatus("Unable to sign in");
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-secondary">Welcome back</h1>
        <p className="text-sm text-charcoal/70">
          Access your ethics and compliance learning journey with secure JWT-based authentication.
        </p>
      </header>

      <form className="card space-y-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-secondary">Email</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-secondary">Password</span>
          <input
            required
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="input"
          />
        </label>
        <button type="submit" className="button-primary w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        {status && <p className="text-xs text-charcoal/60">{status}</p>}
      </form>
    </section>
  );
}
