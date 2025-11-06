import AdminWorkspace from "../../components/AdminWorkspace";

export default function AdminPage() {
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-secondary">Administrator Workspace</h1>
        <p className="text-sm text-charcoal/70">
          Manage ethics and compliance courses, learner accounts, analytics, and regulatory exports. All updates
          write directly to the Neon-backed Prisma database with JWT-protected access.
        </p>
      </header>
      <AdminWorkspace />
    </section>
  );
}
