"use client";

import { useEffect } from "react";
import AdminAnalyticsPanel from "./AdminAnalyticsPanel";
import AdminCourseManager from "./AdminCourseManager";
import AdminUserManager from "./AdminUserManager";
import { useAuth } from "../hooks/useAuth";

export default function AdminWorkspace() {
  const { user, token, refresh } = useAuth();

  useEffect(() => {
    if (token) {
      void refresh();
    }
  }, [token, refresh]);

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="card space-y-3 text-sm text-charcoal/70">
        <h2 className="text-lg font-semibold text-secondary">Administrator access required</h2>
        <p>
          Sign in with an administrator account to manage courses, users, and compliance analytics. Learner
          accounts will not see this workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminCourseManager />
      <AdminUserManager />
      <AdminAnalyticsPanel />
    </div>
  );
}
