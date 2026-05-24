/**
 * ChangesPanel — the "变更板块" in the right sidebar.
 * Shows a file tree of pending edit blocks, reusing the EditBlock type
 * from edit-blocks.ts and the load-pending-edits flow from pending-edits.ts.
 *
 * Each file shows ± line counts; directories are collapsible.
 */

import { Box, Text } from "ink";
// biome-ignore lint/style/useImportType: React used as value for JSX
import * as React from "react";
import { useMemo } from "react";
import type { EditBlock } from "../../../code/edit-blocks.js";
import { FG, TONE } from "../theme/tokens.js";

// ── Tree-building helpers ─────────────────────────────────────────

interface FileNode {
  kind: "file";
  name: string;
  path: string;
  added: number;
  removed: number;
}

interface DirNode {
  kind: "dir";
  name: string;
  path: string;
  children: TreeNode[];
}

type TreeNode = FileNode | DirNode;

function buildFileTree(blocks: readonly EditBlock[]): DirNode {
  const root: DirNode = { kind: "dir", name: "", path: "", children: [] };

  for (const block of blocks) {
    const parts = block.path.split("/");
    const fileName = parts[parts.length - 1] ?? block.path;
    const added = countLines(block.replace);
    const removed = block.search === "" ? 0 : countLines(block.search);

    // Walk/create directory chain
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i]!;
      const dirPath = parts.slice(0, i + 1).join("/");
      let child = current.children.find(
        (c): c is DirNode => c.kind === "dir" && c.name === dirName,
      );
      if (!child) {
        child = { kind: "dir", name: dirName, path: dirPath, children: [] };
        current.children.push(child);
      }
      current = child;
    }

    // Add file node (deduplicate by path — sum counts for duplicates)
    const fileNode = current.children.find(
      (c): c is FileNode => c.kind === "file" && c.path === block.path,
    );
    if (fileNode) {
      fileNode.added += added;
      fileNode.removed += removed;
    } else {
      current.children.push({
        kind: "file",
        name: fileName,
        path: block.path,
        added,
        removed,
      });
    }
  }

  // Sort: dirs first, then alphabetically
  sortTree(root);
  return root;
}

function sortTree(node: DirNode): void {
  node.children.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const child of node.children) {
    if (child.kind === "dir") sortTree(child);
  }
}

function countLines(s: string): number {
  if (s.length === 0) return 0;
  return (s.match(/\n/g)?.length ?? 0) + 1;
}

// ── Props ─────────────────────────────────────────────────────────

export interface ChangesPanelProps {
  /** Pending edit blocks to render as a file tree. */
  blocks: readonly EditBlock[];
}

// ── Component ─────────────────────────────────────────────────────

export function ChangesPanel({ blocks }: ChangesPanelProps): React.ReactElement {
  const tree = useMemo(() => buildFileTree(blocks), [blocks]);
  const fileCount = useMemo(() => countFiles(tree), [tree]);
  // All directories expanded by default (Ink doesn't support onClick on Box).
  const expanded = useMemo(() => {
    const s = new Set<string>();
    collectDirPaths(tree, s);
    return s;
  }, [tree]);

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      {/* Header */}
      <Box>
        <Text bold color={TONE.ok}>
          {"± "}
        </Text>
        <Text bold color={TONE.ok}>
          changes
        </Text>
        <Text color={FG.faint}>
          {fileCount > 0 ? `  ${fileCount} file${fileCount === 1 ? "" : "s"}` : ""}
        </Text>
      </Box>

      {/* Divider */}
      <Box>
        <Text color={FG.faint}>{"─".repeat(20)}</Text>
      </Box>

      {/* File tree */}
      {blocks.length === 0 ? (
        <Box marginTop={1}>
          <Text color={FG.faint} italic>
            no pending changes
          </Text>
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          {tree.children.map((node) => (
            <TreeNodeRow key={node.path} node={node} depth={0} expanded={expanded} />
          ))}
        </Box>
      )}
    </Box>
  );
}

// ── Tree node row ─────────────────────────────────────────────────

function collectDirPaths(node: DirNode, out: Set<string>): void {
  out.add(node.path);
  for (const child of node.children) {
    if (child.kind === "dir") collectDirPaths(child, out);
  }
}

function TreeNodeRow({
  node,
  depth,
  expanded,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
}): React.ReactElement {
  const indent = "  ".repeat(depth);

  if (node.kind === "dir") {
    const isExpanded = expanded.has(node.path);
    const glyph = isExpanded ? "▾" : "▸";
    const fileCount = countFiles(node);
    return (
      <Box flexDirection="column">
        <Box flexDirection="row">
          <Text color={FG.faint}>{indent}</Text>
          <Text color={FG.sub}>{glyph}</Text>
          <Text> </Text>
          <Text color={FG.body}>{node.name}/</Text>
          <Text color={FG.faint}>
            {"  "}
            {fileCount}
          </Text>
        </Box>
        {isExpanded
          ? node.children.map((child) => (
              <TreeNodeRow key={child.path} node={child} depth={depth + 1} expanded={expanded} />
            ))
          : null}
      </Box>
    );
  }

  // File node
  const addColor = node.added > 0 ? TONE.ok : FG.faint;
  const delColor = node.removed > 0 ? TONE.err : FG.faint;
  return (
    <Box flexDirection="row">
      <Text color={FG.faint}>{indent}</Text>
      <Text color={FG.body}>{node.name}</Text>
      <Text> </Text>
      <Text color={addColor}>{node.added > 0 ? `+${node.added}` : ""}</Text>
      <Text> </Text>
      <Text color={delColor}>{node.removed > 0 ? `-${node.removed}` : ""}</Text>
    </Box>
  );
}

function countFiles(node: DirNode): number {
  let count = 0;
  for (const child of node.children) {
    if (child.kind === "file") count++;
    else count += countFiles(child);
  }
  return count;
}
