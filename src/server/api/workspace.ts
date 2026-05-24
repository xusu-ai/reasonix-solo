import { statSync } from "node:fs";
import { basename, resolve } from "node:path";
import { freshSessionName, listSessions } from "../../memory/session.js";
import type { DashboardContext } from "../context.js";
import type { ApiResult } from "../router.js";

export async function handleWorkspace(
  method: string,
  _rest: string[],
  body: string,
  ctx: DashboardContext,
): Promise<ApiResult> {
  if (method !== "POST") return { status: 405, body: { error: "POST only" } };

  let parsed: { path?: string };
  try {
    parsed = JSON.parse(body || "{}");
  } catch {
    return { status: 400, body: { error: "invalid JSON body" } };
  }

  if (typeof parsed.path !== "string" || parsed.path.trim().length === 0) {
    return { status: 400, body: { error: "path required" } };
  }

  const newPath = resolve(parsed.path.trim());
  let st: ReturnType<typeof statSync>;
  try {
    st = statSync(newPath);
  } catch {
    return { status: 400, body: { error: `path does not exist: ${newPath}` } };
  }
  if (!st.isDirectory()) {
    return { status: 400, body: { error: `${newPath} is not a directory` } };
  }

  // Switch the workspace root in the TUI
  const switched = ctx.switchCwd?.(newPath);
  if (!switched) {
    return {
      status: 503,
      body: { error: "workspace switching not available (not in code mode?)" },
    };
  }
  if (!switched.ok) {
    return { status: 400, body: { error: switched.info } };
  }

  // Find sessions for this workspace
  const workspaceSessions = listSessions({ workspaceFilter: newPath });

  if (workspaceSessions.length > 0) {
    // Auto-switch to the most recent session
    const mostRecent = workspaceSessions[0]!;
    const switchedSession = ctx.switchSession?.(mostRecent.name);
    return {
      status: 200,
      body: {
        switched: true,
        path: newPath,
        session: mostRecent.name,
        sessionSwitched: switchedSession?.ok ?? false,
        sessions: workspaceSessions.map((s) => ({
          name: s.name,
          size: s.size,
          mtime: s.mtime.getTime(),
        })),
      },
    };
  }

  // No sessions — return a fresh session name suggestion
  const dirName = basename(newPath);
  const freshName = freshSessionName(`workspace-${dirName}`);

  return {
    status: 200,
    body: {
      switched: true,
      path: newPath,
      freshSession: freshName,
      sessions: [],
    },
  };
}
