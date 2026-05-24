import { useEffect, useRef, useState } from "preact/hooks";
import { api } from "../lib/api.js";
import { fmtNum, fmtPct, fmtUsd } from "../lib/format.js";
import { html } from "../lib/html.js";
import { usePoll } from "../lib/use-poll.js";
import { t, useLang } from "../i18n/index.js";

type UPlotInstance = {
  destroy(): void;
  setSize(opts: { width: number; height: number }): void;
};

type UPlotConstructor = new (
  opts: unknown,
  data: unknown,
  el: HTMLElement,
) => UPlotInstance;

let uPlotPromise: Promise<UPlotConstructor> | null = null;
function loadUPlot(): Promise<UPlotConstructor> {
  if (!uPlotPromise) {
    uPlotPromise = import("uplot").then(
      (m) => (m.default ?? m) as UPlotConstructor,
    );
  }
  return uPlotPromise;
}

interface UsageDay {
  day: string;
  costUsd: number;
  cacheSavingsUsd: number;
  turns: number;
}

function UsageChart({ days }: { days: UsageDay[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<UPlotInstance | null>(null);
  const uPlotCtorRef = useRef<UPlotConstructor | null>(null);
  const [plotLoading, setPlotLoading] = useState(true);
  const [plotError, setPlotError] = useState<string | null>(null);
  useLang();

  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | null = null;

    setPlotLoading(true);
    setPlotError(null);

    function createOrResize() {
      if (cancelled || !containerRef.current) return;
      const ctor = uPlotCtorRef.current;
      if (!ctor) return;
      const w = containerRef.current.clientWidth;
      if (w <= 0) return; // Defer until the container has a real width.
      if (!days || days.length === 0) {
        setPlotLoading(false);
        return;
      }

      // Already created — just resize.
      if (plotRef.current) {
        plotRef.current.setSize({ width: w, height: 300 });
        return;
      }

      const xs = days.map((d) => Math.floor(Date.parse(d.day) / 1000));
      const cost = days.map((d) => d.costUsd);
      const saved = days.map((d) => d.cacheSavingsUsd);
      const turns = days.map((d) => d.turns);
      const data = [xs, cost, saved, turns];
      plotRef.current = new ctor(
        {
          width: w,
          height: 300,
          cursor: { drag: { x: true, y: false } },
          scales: {
            x: { time: true },
            y: { auto: true },
            turns: { auto: true },
          },
          axes: [
            { stroke: "#94a3b8", grid: { stroke: "rgba(148, 163, 184, 0.08)" } },
            {
              scale: "y",
              label: t("usage.axisUsd"),
              stroke: "#94a3b8",
              size: 70,
              grid: { stroke: "rgba(148, 163, 184, 0.08)" },
              values: (_u: unknown, v: number[]) => {
                // Smart dollar formatting: fewer decimals for larger amounts.
                const fmt = (n: number) => {
                  const abs = Math.abs(n);
                  if (abs === 0) return "$0";
                  return abs < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
                };
                // Prevent label overlap: show at most 6 ticks on the Y axis.
                const maxTicks = 6;
                if (v.length <= maxTicks) return v.map(fmt);
                const step = Math.ceil(v.length / maxTicks);
                return v.map((n, i) => (i % step === 0 ? fmt(n) : null));
              },
            },
            {
              scale: "turns",
              side: 1,
              label: t("usage.axisTurns"),
              stroke: "#94a3b8",
              grid: { show: false },
            },
          ],
          series: [
            { label: t("usage.axisTime") },
            {
              label: t("usage.seriesCost"),
              stroke: "#67e8f9",
              width: 2,
              fill: "rgba(103, 232, 249, 0.10)",
            },
            { label: t("usage.seriesCacheSaved"), stroke: "#5eead4", width: 2, dash: [4, 4] },
            {
              label: t("usage.seriesTurns"),
              stroke: "#c4b5fd",
              scale: "turns",
              width: 1.5,
              points: { show: true, size: 4 },
            },
          ],
          legend: { live: true },
        },
        data,
        containerRef.current,
      );
      setPlotLoading(false);
    }

    loadUPlot()
      .then((ctor) => {
        if (cancelled) return;
        uPlotCtorRef.current = ctor;
        ro = new ResizeObserver(createOrResize);
        if (containerRef.current) ro.observe(containerRef.current);
        // Try immediately — the container may already have a valid width.
        createOrResize();
      })
      .catch((err) => {
        if (!cancelled) {
          setPlotError((err as Error).message ?? "uPlot failed to load");
          setPlotLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (ro) ro.disconnect();
      if (plotRef.current) {
        plotRef.current.destroy();
        plotRef.current = null;
      }
    };
  }, [days]);

  return html`<div ref=${containerRef} style="width: 100%; min-height: 300px; position: relative;">
    ${plotError
      ? html`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--fg-3);font-size:13px;background:var(--bg-card);z-index:1">⚠ ${plotError}</div>`
      : plotLoading
        ? html`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--fg-3);gap:8px;background:var(--bg-card);z-index:1">
            <span class="spinner-sm"></span> ${t("common.loading")}
          </div>`
        : null}
  </div>`;
}

interface Bucket {
  label: string;
  turns: number;
  cacheHitTokens: number;
  cacheMissTokens: number;
  costUsd: number;
  cacheSavingsUsd: number;
  claudeEquivUsd: number;
}

interface UsageSummary {
  recordCount: number;
  logSize: string;
  buckets: Bucket[];
  byModel: { model: string; turns: number }[];
  subagents?: { total: number; costUsd: number; totalDurationMs: number };
}

export function UsagePanel() {
  useLang();
  const { data: summary, error, loading } = usePoll<UsageSummary>("/usage", 5000);
  const [series, setSeries] = useState<UsageDay[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await api<{ days?: UsageDay[] }>("/usage/series");
        if (!cancelled) setSeries(s.days ?? []);
      } catch {
        /* keep null; chart hides */
      }
    })();
    const interval = setInterval(async () => {
      try {
        const s = await api<{ days?: UsageDay[] }>("/usage/series");
        if (!cancelled) setSeries(s.days ?? []);
      } catch {
        /* swallow */
      }
    }, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loading && !summary)
    return html`<div class="card" style="color:var(--fg-3)">${t("usage.loading")}</div>`;
  if (error) return html`<div class="card accent-err">${t("common.loadingFailed", { name: "usage", error: error.message })}</div>`;
  if (!summary) return null;
  const u = summary;

  const sectionH3 = (text: string) => html`
    <h3 style="margin:18px 0 8px;font-family:var(--font-mono);font-size:11px;color:var(--fg-3);text-transform:uppercase;letter-spacing:.1em">${text}</h3>
  `;

  return html`
    <div style="display:flex;flex-direction:column;gap:6px">
      <div class="chips">
        <span class="chip-f static active">${t("usage.records", { count: u.recordCount.toLocaleString() })}</span>
        <span class="chip-f static">${u.logSize}</span>
      </div>

      ${
        series && series.length > 0
          ? html`
            <div class="card" style="padding:18px">
              <div class="card-h">
                <span class="title">${t("usage.dailyUsage")}</span>
                <span class="meta">${t("usage.dailyMeta")}</span>
              </div>
              <${UsageChart} days=${series} />
            </div>
          `
          : null
      }

      ${
        u.recordCount === 0
          ? html`<div class="card" style="color:var(--fg-3);margin-top:8px">
              ${t("usage.noData")}
            </div>`
          : html`
              ${sectionH3(t("usage.windows"))}
              <div class="card" style="padding:0;overflow:hidden">
                <table class="tbl">
                  <thead>
                    <tr>
                      <th>${t("usage.colWindow")}</th>
                      <th class="num">${t("usage.colTurns")}</th>
                      <th class="num">${t("usage.colCacheHit")}</th>
                      <th class="num">${t("usage.colCost")}</th>
                      <th class="num">${t("usage.colCacheSaved")}</th>
                      <th class="num">${t("usage.colVsClaude")}</th>
                      <th class="num">${t("usage.colSaved")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${u.buckets.map((b) => {
                      const hitRatio =
                        b.cacheHitTokens + b.cacheMissTokens > 0
                          ? b.cacheHitTokens / (b.cacheHitTokens + b.cacheMissTokens)
                          : 0;
                      const claudeSavings =
                        b.claudeEquivUsd > 0 ? 1 - b.costUsd / b.claudeEquivUsd : 0;
                      return html`
                        <tr>
                          <td class="dim">${b.label}</td>
                          <td class="num">${fmtNum(b.turns)}</td>
                          <td class="num">${b.turns > 0 ? fmtPct(hitRatio) : "—"}</td>
                          <td class="num">${b.turns > 0 ? fmtUsd(b.costUsd) : "—"}</td>
                          <td class="num">${b.turns > 0 && b.cacheSavingsUsd > 0 ? fmtUsd(b.cacheSavingsUsd) : "—"}</td>
                          <td class="num">${b.turns > 0 ? fmtUsd(b.claudeEquivUsd) : "—"}</td>
                          <td class="num">${b.turns > 0 && claudeSavings > 0 ? fmtPct(claudeSavings) : "—"}</td>
                        </tr>
                      `;
                    })}
                  </tbody>
                </table>
              </div>
            `
      }

      ${
        u.byModel.length > 0
          ? html`
              ${sectionH3(t("usage.mostUsed"))}
              <div class="card" style="padding:0;overflow:hidden">
                <table class="tbl">
                  <thead>
                    <tr>
                      <th>${t("usage.colModel")}</th>
                      <th>${t("usage.colTurns")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${u.byModel.slice(0, 5).map(
                      (m) => html`
                        <tr>
                          <td><code class="mono">${m.model}</code></td>
                          <td class="num">${fmtNum(m.turns)}</td>
                        </tr>
                      `,
                    )}
                  </tbody>
                </table>
              </div>
            `
          : null
      }
    </div>
  `;
}
