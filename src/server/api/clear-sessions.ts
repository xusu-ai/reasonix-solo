import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { deleteSession, listSessions, sessionPath, sessionsDir } from "../../memory/session.js";
import type { DashboardContext } from "../context.js";
import type { ApiResult } from "../router.js";

/** Sidecar extensions that accompany a .jsonl session file. */
const SIDECAR_EXTS = [
  ".events.jsonl",
  ".meta.json",
  ".pending.json",
  ".plan.json",
  ".jsonl.bak",
] as const;

export async function handleClearSessions(
  method: string,
  _rest: string[],
  _body: string,
  ctx: DashboardContext,
): Promise<ApiResult> {
  if (method !== "POST") {
    return { status: 405, body: { error: "POST only" } };
  }

  const sessions = listSessions();
  const currentName = ctx.getSessionName?.() ?? null;
  const deleted: string[] = [];
  const errors: string[] = [];

  for (const s of sessions) {
    if (currentName && s.name === currentName) {
      // Cannot delete the currently-active session.
      continue;
    }
    const removed = deleteSession(s.name);
    if (removed) {
      deleted.push(s.name);
    } else {
      errors.push(s.name);
    }
  }

  ctx.audit?.({ ts: Date.now(), action: "clear-sessions", payload: { deleted, errors } });

  return {
    status: 200,
    body: {
      ok: true,
      deleted,
      errors: errors.length > 0 ? errors : undefined,
      skipped:
        currentName && sessions.some((s) => s.name === currentName) ? [currentName] : undefined,
    },
  };
}
