import { clearAllPlanArchives } from "../../code/plan-store.js";
import type { DashboardContext } from "../context.js";
import type { ApiResult } from "../router.js";

export async function handleClearPlans(
  method: string,
  _rest: string[],
  _body: string,
  ctx: DashboardContext,
): Promise<ApiResult> {
  if (method !== "POST") {
    return { status: 405, body: { error: "POST only" } };
  }

  const { deleted, errors } = clearAllPlanArchives();

  ctx.audit?.({
    ts: Date.now(),
    action: "clear-plans",
    payload: { deleted, errors },
  });

  return {
    status: 200,
    body: {
      ok: true,
      deleted,
      errors: errors > 0 ? errors : undefined,
    },
  };
}
