"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";

type UserRecord = {
  id: string;
  email: string;
  name?: string | null;
  role: "ADMIN" | "LEARNER";
  createdAt: string;
};

const initialForm = {
  email: "",
  password: "",
  name: "",
  role: "LEARNER" as "ADMIN" | "LEARNER"
};

export default function AdminUserManager() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        setStatus("Unable to load users");
        return;
      }
      const data = (await response.json()) as { users: UserRecord[] };
      setUsers(data.users);
      setStatus(null);
    } catch (error) {
      console.error(error);
      setStatus("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [token]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setStatus("Authentication required");
      return;
    }

    setStatus("Creating user...");
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to create user" }));
      setStatus(error.message ?? "Failed to create user");
      return;
    }

    setStatus("User created");
    setForm(initialForm);
    await loadUsers();
  };

  const deleteUser = async (id: string) => {
    if (!token) {
      return;
    }
    if (currentUser?.id === id) {
      setStatus("You cannot delete your own administrator account");
      return;
    }

    const response = await fetch(`/api/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      setStatus("Failed to delete user");
      return;
    }

    setUsers((prev) => prev.filter((user) => user.id !== id));
    setStatus("User deleted");
  };

  const toggleRole = async (id: string, role: "ADMIN" | "LEARNER") => {
    if (!token) {
      return;
    }

    const response = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ role })
    });

    if (!response.ok) {
      setStatus("Failed to update role");
      return;
    }

    const data = (await response.json()) as { user: UserRecord };
    setUsers((prev) => prev.map((user) => (user.id === id ? data.user : user)));
    setStatus("Role updated");
  };

  return (
    <div className="card space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-secondary">User management</h2>
          <p className="text-xs text-charcoal/60">Invite new learners or manage administrator access.</p>
        </div>
        <button type="button" className="button-secondary" onClick={loadUsers} disabled={loading}>
          Refresh
        </button>
      </header>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
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
          <span className="font-semibold text-secondary">Name</span>
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="input"
            placeholder="Optional"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-secondary">Temporary password</span>
          <input
            required
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-secondary">Role</span>
          <select
            value={form.role}
            onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as "ADMIN" | "LEARNER" }))}
            className="input"
          >
            <option value="LEARNER">Learner</option>
            <option value="ADMIN">Administrator</option>
          </select>
        </label>
        <div className="md:col-span-2 flex justify-end">
          <button type="submit" className="button-primary">
            Invite user
          </button>
        </div>
      </form>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-secondary">Existing users</h3>
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-2 rounded-lg border border-secondary/20 p-3 text-sm md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-secondary">{user.name ?? user.email}</p>
                <p className="text-xs text-charcoal/60">{user.email}</p>
                <p className="text-xs text-charcoal/50">
                  Joined {new Date(user.createdAt).toLocaleDateString()} · Role: {user.role}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={user.role}
                  onChange={(event) => toggleRole(user.id, event.target.value as "ADMIN" | "LEARNER")}
                  className="input"
                >
                  <option value="LEARNER">Learner</option>
                  <option value="ADMIN">Administrator</option>
                </select>
                <button
                  type="button"
                  onClick={() => deleteUser(user.id)}
                  className="rounded-full border border-red-500 px-3 py-1 text-xs text-red-600 transition hover:bg-red-50"
                  disabled={currentUser?.id === user.id}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && !loading && (
            <p className="text-sm text-charcoal/60">No users yet. Invite your first learner above.</p>
          )}
        </div>
      </section>

      {status && <p className="text-xs text-charcoal/60">{status}</p>}
    </div>
  );
}
