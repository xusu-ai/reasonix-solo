/**
 * SessionPanel — the "会话模块" in the right sidebar.
 * Shows current session identity + cost/context summary.
 */

import { DEEPSEEK_CONTEXT_TOKENS } from "@/telemetry/stats.js";
import { Box, Text } from "ink";
// biome-ignore lint/style/useImportType: React used as value for JSX
import * as React from "react";
import { useAgentState } from "../state/provider.js";
import { FG, TONE } from "../theme/tokens.js";
import { formatCost } from "../theme/tokens.js";

const COLD_START_TURNS = 3;

export function SessionPanel(): React.ReactElement {
  const session = useAgentState((s) => s.session);
  const status = useAgentState((s) => s.status);
  const cardCount = useAgentState((s) => s.cards.length);
  const coldStart = status.sessionCost <= 0 || cardCount <= COLD_START_TURNS;

  const ctxCap = status.promptCap ?? DEEPSEEK_CONTEXT_TOKENS[session.model] ?? 128_000;
  const ctxRatio = status.promptTokens ? status.promptTokens / ctxCap : 0;

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      {/* Header */}
      <Box>
        <Text bold color={TONE.brand}>
          {"◈ "}
        </Text>
        <Text bold color={TONE.brand}>
          session
        </Text>
      </Box>

      <Box flexDirection="column" marginTop={1} gap={0}>
        {/* Model */}
        <InfoRow label="model" value={session.model} />

        {/* Session cost */}
        <InfoRow
          label="cost"
          value={formatCost(status.sessionCost, status.balanceCurrency)}
          color={
            status.sessionCost > 0 && !coldStart ? sessionCostColor(status.sessionCost) : undefined
          }
        />

        {/* Cache hit ratio */}
        <Box flexDirection="row">
          <Text color={FG.faint}>cache </Text>
          <Text
            color={
              coldStart
                ? FG.faint
                : status.cacheHit >= 0.7
                  ? TONE.ok
                  : status.cacheHit >= 0.4
                    ? TONE.warn
                    : TONE.err
            }
            dimColor={coldStart}
          >
            {coldStart ? "—" : `${(status.cacheHit * 100).toFixed(0)}%`}
          </Text>
        </Box>

        {/* Context usage */}
        {status.promptTokens ? (
          <Box flexDirection="row">
            <Text color={FG.faint}>ctx </Text>
            <Text
              color={ctxRatio >= 0.8 ? TONE.err : ctxRatio >= 0.6 ? TONE.warn : TONE.ok}
              bold={ctxRatio >= 0.6}
            >
              {formatTokens(status.promptTokens)}/{formatTokens(ctxCap)}
            </Text>
          </Box>
        ) : null}

        {/* Tokens (input / output) */}
        <Box flexDirection="row">
          <Text color={FG.faint}>tok </Text>
          <Text color={FG.sub}>
            {"↓"}
            {formatTokens(status.sessionInputTokens)}
            {" ↑"}
            {formatTokens(status.sessionOutputTokens)}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

function InfoRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}): React.ReactElement {
  return (
    <Box flexDirection="row">
      <Text color={FG.faint}>{label.padEnd(6)}</Text>
      <Text color={color ?? FG.body}>{value}</Text>
    </Box>
  );
}

function formatTokens(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return k >= 100 ? `${k.toFixed(0)}K` : `${k.toFixed(1)}K`;
}

function sessionCostColor(cost: number): string | undefined {
  if (cost <= 0) return undefined;
  if (cost >= 5) return TONE.err;
  if (cost >= 0.5) return TONE.warn;
  return TONE.ok;
}
