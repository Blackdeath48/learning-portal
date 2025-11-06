export interface XAPIStatement {
  actor: {
    account?: { homePage: string; name: string };
    mbox?: string;
    name?: string;
  };
  verb: {
    id: string;
    display: Record<string, string>;
  };
  object: {
    id: string;
    definition?: {
      name?: Record<string, string>;
      description?: Record<string, string>;
    };
  };
  result?: {
    success?: boolean;
    completion?: boolean;
    score?: { raw?: number; min?: number; max?: number; scaled?: number };
    response?: string;
  };
  context?: Record<string, unknown>;
  timestamp?: string;
}

export function validateXAPIStatement(statement: XAPIStatement) {
  if (!statement.actor || (!statement.actor.mbox && !statement.actor.account)) {
    throw new Error("An actor with an mbox or account is required for xAPI statements.");
  }

  if (!statement.verb?.id) {
    throw new Error("A verb id is required for xAPI statements.");
  }

  if (!statement.object?.id) {
    throw new Error("An object id is required for xAPI statements.");
  }
}
