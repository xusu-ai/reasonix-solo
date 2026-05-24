/**
 * RightSidebar — the right sidebar container.
 * Contains SessionPanel (top) and ChangesPanel (bottom).
 * Supports collapse/expand via Ctrl+\ or the «/» toggle buttons.
 */

import { Box, Text } from "ink";
// biome-ignore lint/style/useImportType: React used as value for JSX
import * as React from "react";

import type { EditBlock } from "../../../code/edit-blocks.js";
import { FG, SURFACE, TONE } from "../theme/tokens.js";
import { ChangesPanel } from "./ChangesPanel.js";
import { SessionPanel } from "./SessionPanel.js";

export interface RightSidebarProps {
  /** Pending edit blocks to show in the changes file tree. */
  pendingBlocks: readonly EditBlock[];
  /** When true, render the collapsed narrow strip. */
  collapsed?: boolean;
  /** Called when the user presses the toggle hint key. */
  onToggle?: () => void;
}

export function RightSidebar({
  pendingBlocks,
  collapsed = false,
  onToggle,
}: RightSidebarProps): React.ReactElement {
  if (collapsed) {
    return (
      <Box
        flexDirection="column"
        width={4}
        flexShrink={0}
        flexGrow={0}
        backgroundColor={SURFACE.bgElev}
        paddingX={1}
        paddingY={0}
      >
        {/* Expand toggle — inverse styling makes it look like a pushable button */}
        <Box>
          <Text color="black" backgroundColor={TONE.brand} bold>
            {" » "}
          </Text>
        </Box>
        {/* Collapsed status icons */}
        <Box flexDirection="column" marginTop={1} gap={0}>
          <Text color={FG.faint}>◈</Text>
          <Text color={FG.faint}>$</Text>
          <Text color={FG.faint}>±</Text>
        </Box>
        <Box flexDirection="column" marginTop={1} gap={0}>
          <Text color={FG.meta}>▣</Text>
          <Text color={FG.meta}>▸</Text>
          <Text color={FG.meta}>·</Text>
        </Box>
        <Box marginTop={1}>
          <Text color={FG.faint} dimColor>
            ⌘
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      width={30}
      flexShrink={0}
      flexGrow={0}
      backgroundColor={SURFACE.bgElev}
    >
      {/* Collapse toggle row — inverse « looks like a button */}
      <Box paddingX={1} paddingY={0}>
        <Text color="black" backgroundColor={TONE.brand} bold>
          {" « "}
        </Text>

      </Box>
      <SessionPanel />
      <ChangesPanel blocks={pendingBlocks} />
    </Box>
  );
}
