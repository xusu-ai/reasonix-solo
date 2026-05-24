import { existsSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";
import type { DashboardContext } from "../context.js";
import type { ApiResult } from "../router.js";

/** Max results for @-mention file picker (walk function). */
const RESULT_CAP = 50;
/** Max recursion depth for tree building. */
const MAX_DEPTH = 6;
/** Max children per directory node in the tree, prevents OOM on huge dirs. */
const CHILD_CAP = 200;
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".reasonix",
  "dist",
  "build",
  "out",
  ".next",
  "coverage",
  ".cache",
  "__pycache__",
  ".venv",
  ".pytest_cache",
  // System virtual filesystems — huge, slow, not relevant for workspace browsing
  "proc",
  "sys",
  "dev",
  "tmp",
]);
const SKIP_EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".zip",
  ".tar",
  ".gz",
  ".lock",
  ".woff",
  ".woff2",
  ".ttf",
]);

export interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: TreeNode[];
}

export async function handleProjectTree(
  method: string,
  _rest: string[],
  _body: string,
  ctx: DashboardContext,
  query: URLSearchParams = new URLSearchParams(),
): Promise<ApiResult> {
  if (method !== "GET") return { status: 405, body: { error: "GET only" } };
  const rootOverride = query.get("root");
  const cwd = rootOverride && existsSync(rootOverride) ? rootOverride : ctx.getCurrentCwd?.();
  if (!cwd || !existsSync(cwd)) {
    return { status: 503, body: { error: "no project directory available" } };
  }
  // With root override, show moderate depth for workspace browsing (depth 3)
  // Depth 4 was too slow and caused timeouts on large filesystems.
  const maxDepth = rootOverride ? 3 : MAX_DEPTH;
  const dirsOnly = !!rootOverride;
  const tree = buildTree(cwd, cwd, 0, maxDepth, dirsOnly);
  return { status: 200, body: { tree } };
}

function buildTree(
  root: string,
  dirPath: string,
  depth: number,
  maxDepthOverride?: number,
  dirsOnly?: boolean,
): TreeNode[] {
  const maxDepth = maxDepthOverride ?? MAX_DEPTH;
  // Off-by-one fix: depth >= maxDepth stops at the right level.
  // E.g. maxDepth=3: depth=0→process,1→process,2→process,3→stop (=3 levels).
  if (depth >= maxDepth) return [];
  let names: string[];
  try {
    names = readdirSync(dirPath);
  } catch {
    return [];
  }
  // Sort alphabetically before capping so the first N entries are
  // the alphabetically-first N, not an arbitrary filesystem slice.
  names.sort((a, b) => a.localeCompare(b));
  // Cap total children so huge directories don't blow up the response.
  if (names.length > CHILD_CAP) names = names.slice(0, CHILD_CAP);
  const nodes: TreeNode[] = [];
  for (const name of names) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dirPath, name);
    let st: ReturnType<typeof statSync>;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      const rel = relative(root, full).split(sep).join("/");
      const children = buildTree(root, full, depth + 1, maxDepthOverride, dirsOnly);
      nodes.push({ name, path: rel, isDir: true, children });
    } else if (!dirsOnly && st.isFile() && !SKIP_EXTS.has(extname(name).toLowerCase())) {
      const rel = relative(root, full).split(sep).join("/");
      nodes.push({ name, path: rel, isDir: false });
    }
  }
  // Sort: directories first, then alphabetically
  nodes.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return nodes;
}

export async function handleFiles(
  method: string,
  _rest: string[],
  body: string,
  ctx: DashboardContext,
): Promise<ApiResult> {
  if (method === "GET") {
    return await handleProjectTree("GET", _rest, body, ctx);
  }
  if (method !== "POST") return { status: 405, body: { error: "GET or POST only" } };
  const cwd = ctx.getCurrentCwd?.();
  if (!cwd || !existsSync(cwd)) {
    return { status: 503, body: { error: "@-mention picker requires a code-mode session" } };
  }
  let parsed: { prefix?: unknown };
  try {
    parsed = JSON.parse(body || "{}");
  } catch {
    return { status: 400, body: { error: "body must be JSON" } };
  }
  const prefix = typeof parsed.prefix === "string" ? parsed.prefix.trim().toLowerCase() : "";
  const matches = walk(cwd, prefix);
  return { status: 200, body: { files: matches } };
}

function walk(root: string, prefix: string): string[] {
  const out: string[] = [];
  const stack: Array<{ path: string; depth: number }> = [{ path: root, depth: 0 }];
  while (stack.length > 0 && out.length < RESULT_CAP) {
    const { path, depth } = stack.pop()!;
    if (depth > MAX_DEPTH) continue;
    let names: string[];
    try {
      names = readdirSync(path);
    } catch {
      continue;
    }
    for (const name of names) {
      if (out.length >= RESULT_CAP) break;
      if (SKIP_DIRS.has(name)) continue;
      const full = join(path, name);
      let st: ReturnType<typeof statSync>;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        stack.push({ path: full, depth: depth + 1 });
        continue;
      }
      if (!st.isFile()) continue;
      if (SKIP_EXTS.has(extname(name).toLowerCase())) continue;
      const rel = relative(root, full).split(sep).join("/");
      if (prefix && !rel.toLowerCase().includes(prefix)) continue;
      out.push(rel);
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}
