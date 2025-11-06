"use client";

interface XAPIStatementLike {
  id: string;
  verb: Record<string, unknown>;
  object: Record<string, unknown>;
  timestamp: string | Date;
}

interface StatementStreamProps {
  statements: XAPIStatementLike[];
}

function formatVerb(statement: XAPIStatementLike) {
  const verb = statement.verb as { display?: Record<string, string>; id?: string } | null;
  return verb?.display?.["en-US"] ?? verb?.id?.split("/").pop() ?? "interacted";
}

function formatObject(statement: XAPIStatementLike) {
  const object = statement.object as {
    definition?: { name?: Record<string, string> };
    id?: string;
  } | null;
  return object?.definition?.name?.["en-US"] ?? object?.id ?? "learning object";
}

function formatTimestamp(timestamp: string | Date) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

export default function StatementStream({ statements }: StatementStreamProps) {
  if (statements.length === 0) {
    return <div className="card text-sm text-charcoal/60">No statements yet.</div>;
  }

  return (
    <ol className="space-y-3">
      {statements.map((statement) => (
        <li key={statement.id} className="card space-y-1 bg-white/70">
          <p className="text-sm text-secondary">
            <span className="font-semibold">{formatVerb(statement)}</span> {formatObject(statement)}
          </p>
          <p className="text-xs text-charcoal/60">{formatTimestamp(statement.timestamp)}</p>
        </li>
      ))}
    </ol>
  );
}
