import {
  type ApiKeyProfile,
  activateApiKeyProfile,
  loadApiKeyProfiles,
  readConfig,
} from "../../config.js";
import type { DashboardContext } from "../context.js";
import type { ApiResult } from "../router.js";

export async function handleApiKeyProfiles(
  method: string,
  rest: string[],
  body: string,
  ctx: DashboardContext,
): Promise<ApiResult> {
  if (method === "GET") {
    const profiles = loadApiKeyProfiles();
    const activeProfileId = readConfig().activeProfileId ?? null;
    return {
      status: 200,
      body: {
        profiles: profiles.map((p) => ({
          id: p.id,
          label: p.label,
          workspace: p.workspace ?? "",
          expiresAt: p.expiresAt ?? "",
          // Never expose the full key — show only prefix + suffix
          keyPreview: p.apiKey ? `${p.apiKey.slice(0, 6)}…${p.apiKey.slice(-3)}` : "",
        })),
        activeProfileId,
      },
    };
  }

  if (method === "POST" && rest[0] === "activate") {
    let profileId: string;
    try {
      const parsed = JSON.parse(body);
      profileId = parsed.profileId;
    } catch {
      return { status: 400, body: { error: "invalid request body" } };
    }

    if (typeof profileId !== "string" || !profileId.trim()) {
      return { status: 400, body: { error: "profileId is required" } };
    }

    const profile = activateApiKeyProfile(profileId.trim());
    if (!profile) {
      return { status: 404, body: { error: `profile not found: ${profileId}` } };
    }

    ctx.audit?.({
      ts: Date.now(),
      action: "switch-api-key",
      payload: { profileId: profile.id, label: profile.label },
    });

    return {
      status: 200,
      body: {
        ok: true,
        profile: {
          id: profile.id,
          label: profile.label,
          workspace: profile.workspace ?? "",
          keyPreview: profile.apiKey
            ? `${profile.apiKey.slice(0, 6)}…${profile.apiKey.slice(-3)}`
            : "",
        },
      },
    };
  }

  return { status: 405, body: { error: "GET or POST /activate only" } };
}
