/**
 * Chart kit fixture page — the C4 definition of done (SPEC §12).
 *
 * A component gallery, in the Storybook sense: every state the kit can be in,
 * rendered from the edition's own data rather than from invented numbers, so what
 * is on screen is what a screen will show. It exists to make four things checkable
 * by eye rather than by argument —
 *
 *   1. a month with no eligible records renders as a gap, never a zero;
 *   2. the reveal is a wipe over final geometry, never a grow-from-zero;
 *   3. `prefers-reduced-motion` collapses that wipe to a fade;
 *   4. the heatmap is fully navigable by keyboard.
 *
 * Served as its own Vite entry at `/charts.html` so it needs no route in the app
 * shell, which another chunk owns.
 */

import { useState } from "react";

import ThemeToggle from "@/components/ThemeToggle";
import {
  MonthlySeries,
  Sparkline,
  WorkHeatmap,
  type BandSize,
} from "@/components/charts";
import {
  monthOf,
  sparklineFrom,
  useScope,
  type Series,
  type ScopeReport,
} from "@/data";
import { useMediaQuery } from "@/components/charts";

import "./fixture.css";

export default function ChartsFixture() {
  const org = useScope("org");
  const helm = useScope("helm-helm");
  const fastapi = useScope("fastapi-fastapi");
  const mitmproxy = useScope("mitmproxy-mitmproxy");

  /* Bumping this remounts every chart, which re-runs the reveal. */
  const [take, setTake] = useState(0);

  const reports = [org, helm, fastapi, mitmproxy];
  const pending = reports.find(report => report.status !== "ready");

  if (pending?.status === "error") {
    return (
      <Frame take={take} onReplay={() => setTake(value => value + 1)}>
        <p className="fx-error">
          The edition could not be read: {pending.error?.message}. The fixture
          page reads the same files the app does, from <code>/data/scopes</code>
          .
        </p>
      </Frame>
    );
  }
  if (pending || !org.data || !helm.data || !fastapi.data || !mitmproxy.data) {
    return (
      <Frame take={take} onReplay={() => setTake(value => value + 1)}>
        <p className="fx-loading">Reading the edition…</p>
      </Frame>
    );
  }

  return (
    <Frame take={take} onReplay={() => setTake(value => value + 1)}>
      <SparklineSection
        key={`spark-${take}`}
        scope={helm.data}
        mitm={mitmproxy.data}
      />
      <GapSection key={`gap-${take}`} scope={mitmproxy.data} />
      <AxisSection
        key={`axis-${take}`}
        helm={helm.data}
        fastapi={fastapi.data}
      />
      <DurationSection key={`dur-${take}`} scope={org.data} />
      <HeatmapSection key={`heat-${take}`} scope={org.data} />
      <RulesSection />
    </Frame>
  );
}

/* -------------------------------------------------------------- chrome */

function Frame({
  children,
  take,
  onReplay,
}: {
  children: React.ReactNode;
  take: number;
  onReplay: () => void;
}) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const narrow = useMediaQuery("(max-width: 780px)");
  const verySmall = useMediaQuery("(max-width: 430px)");

  return (
    <div className="fx">
      <header className="fx-head">
        <div>
          <p className="fx-kicker">Sovix · chunk C4</p>
          <h1>Chart kit</h1>
          <p className="fx-lede">
            Sparkline, MonthlySeries and WorkHeatmap, drawn from this edition's
            own scope files. Two rules hold everywhere below: no chart animates
            its data up from zero, and nothing is reachable only by hover.
          </p>
        </div>
        <div className="fx-controls">
          <ThemeToggle />
          <button type="button" className="fx-button" onClick={onReplay}>
            Replay the reveals
          </button>
        </div>
      </header>

      <dl className="fx-env">
        <div>
          <dt>Take</dt>
          <dd>{take + 1}</dd>
        </div>
        <div>
          <dt>Width band</dt>
          <dd>{verySmall ? "≤430" : narrow ? "431–780" : "≥781"}</dd>
        </div>
        <div>
          <dt>Reduced motion</dt>
          <dd>
            {reducedMotion ? "on — wipes become fades" : "off — wipes run"}
          </dd>
        </div>
      </dl>

      <main className="fx-main">{children}</main>
    </div>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="fx-section">
      <h2>{title}</h2>
      <p className="fx-note">{note}</p>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------ sections */

function seriesOf(report: ScopeReport, id: string): Series {
  const series = report.series.find(candidate => candidate.id === id);
  if (!series) throw new Error(`${report.scope.label} has no ${id} series`);
  return series;
}

function SparklineSection({
  scope,
  mitm,
}: {
  scope: ScopeReport;
  mitm: ScopeReport;
}) {
  const commits = seriesOf(scope, "commits");
  const aiShare = seriesOf(mitm, "ai_share");

  const points = (report: ScopeReport, series: Series) =>
    sparklineFrom(series, report.scope.since, report.scope.until, 12);

  return (
    <Section
      title="Sparkline"
      note={
        <>
          Hand-drawn SVG, resolution-independent, kept at every width down to
          56px of drawn width. Below that it is dropped rather than squashed
          (§7.5) — the last column shows the drop, at 48px.
        </>
      }
    >
      <div className="fx-spark-row">
        <SparkCell label="220px · helm commits" width={220}>
          <Sparkline
            points={points(scope, commits)}
            unit={commits.unit}
            label={commits.label}
          />
        </SparkCell>
        <SparkCell label="120px · helm commits" width={120}>
          <Sparkline
            points={points(scope, commits)}
            unit={commits.unit}
            label={commits.label}
          />
        </SparkCell>
        <SparkCell label="56px · minimum drawn width" width={56}>
          <Sparkline
            points={points(scope, commits)}
            unit={commits.unit}
            label={commits.label}
          />
        </SparkCell>
        <SparkCell label="48px · dropped, not squashed" width={48}>
          <Sparkline
            points={points(scope, commits)}
            unit={commits.unit}
            label={commits.label}
          />
        </SparkCell>
        <SparkCell
          label="220px · mitmproxy AI share, one gap month"
          width={220}
          accentGap
        >
          <Sparkline
            points={points(mitm, aiShare)}
            unit={aiShare.unit}
            label={aiShare.label}
            accent="var(--chart-3)"
          />
        </SparkCell>
      </div>
    </Section>
  );
}

function SparkCell({
  label,
  width,
  children,
  accentGap,
}: {
  label: string;
  width: number;
  children: React.ReactNode;
  accentGap?: boolean;
}) {
  return (
    <figure className="fx-spark" data-gap={accentGap ? "" : undefined}>
      <div style={{ width }}>{children}</div>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function GapSection({ scope }: { scope: ScopeReport }) {
  const aiShare = seriesOf(scope, "ai_share");
  const rework = seriesOf(scope, "rework");
  const { since, until } = scope.scope;

  return (
    <Section
      title="A gap is a gap"
      note={
        <>
          mitmproxy recorded nothing eligible in <strong>December 2025</strong>.
          The line stops, a dotted hairline marks the absent month, and the
          readout says so in words. The months on either side that read{" "}
          <code>0%</code> are different: those are observed zeros, and they sit
          on the axis as points. Selecting the gap month — by tap, by arrow key,
          or with the strip's step buttons — never produces a number.
        </>
      }
    >
      <div className="fx-chart-grid">
        <ChartCard title={aiShare.label} scope={scope.scope.label}>
          <MonthlySeries series={aiShare} since={since} until={until} />
        </ChartCard>
        <ChartCard title={rework.label} scope={scope.scope.label}>
          <MonthlySeries
            series={rework}
            since={since}
            until={until}
            accent="var(--chart-5)"
          />
        </ChartCard>
      </div>
    </Section>
  );
}

function AxisSection({
  helm,
  fastapi,
}: {
  helm: ScopeReport;
  fastapi: ScopeReport;
}) {
  return (
    <Section
      title="Per-scope axes, never a shared one"
      note={
        <>
          helm's window opens {monthOf(helm.scope.since)} and carries 13 months;
          fastapi's opens {monthOf(fastapi.scope.since)} and carries 12. Each
          chart spans its own scope's <code>since</code>→<code>until</code>.
          Putting them on one axis would invent a month of fastapi history that
          was never recorded.
        </>
      }
    >
      <div className="fx-chart-grid">
        <ChartCard title="Commits per month" scope={helm.scope.label}>
          <MonthlySeries
            series={seriesOf(helm, "commits")}
            since={helm.scope.since}
            until={helm.scope.until}
          />
        </ChartCard>
        <ChartCard title="Commits per month" scope={fastapi.scope.label}>
          <MonthlySeries
            series={seriesOf(fastapi, "commits")}
            since={fastapi.scope.since}
            until={fastapi.scope.until}
            accent="var(--chart-2)"
          />
        </ChartCard>
      </div>
    </Section>
  );
}

function DurationSection({ scope }: { scope: ScopeReport }) {
  const leadTime = seriesOf(scope, "lead_time");
  const contributors = seriesOf(scope, "contributors");
  const { since, until } = scope.scope;

  return (
    <Section
      title="Two y-axis anchors"
      note={
        <>
          Counts, lines, percentages and headcounts are anchored at zero,
          because the distance from nothing is the magnitude a reader is
          judging. Hours are anchored at the data: zero hours to merge is not a
          meaningful floor, and pinning the axis there flattens every real
          movement. Both axes are labelled, so neither implies anything the
          ticks do not state. Lead time also carries eight leading months with
          no eligible merges.
        </>
      }
    >
      <div className="fx-chart-grid">
        <ChartCard title={leadTime.label} scope={scope.scope.label}>
          <MonthlySeries
            series={leadTime}
            since={since}
            until={until}
            accent="var(--chart-4)"
          />
        </ChartCard>
        <ChartCard title={contributors.label} scope={scope.scope.label}>
          <MonthlySeries series={contributors} since={since} until={until} />
        </ChartCard>
      </div>
    </Section>
  );
}

function HeatmapSection({ scope }: { scope: ScopeReport }) {
  const [band, setBand] = useState<BandSize | "auto">("auto");

  return (
    <Section
      title="WorkHeatmap, and the band collapse"
      note={
        <>
          24 hourly columns at ≥781px, 12 two-hour bands at ≤780, six four-hour
          bands at ≤430. A band <strong>sums</strong> its hours — it never
          samples one and drops the rest, which would print a smaller number
          than the truth and call it the truth. The hours a band summed stay one
          tap away in the readout strip. Tab into the grid and walk it with the
          arrow keys; Home and End jump to the ends of a row.
        </>
      }
    >
      <div className="fx-band-picker" role="group" aria-label="Band size">
        {(["auto", 1, 2, 4] as const).map(option => (
          <button
            key={String(option)}
            type="button"
            className="fx-chip"
            data-active={band === option ? "" : undefined}
            aria-pressed={band === option}
            onClick={() => setBand(option)}
          >
            {option === "auto"
              ? "Follow the viewport"
              : option === 1
                ? "24 hourly"
                : option === 2
                  ? "12 two-hour"
                  : "6 four-hour"}
          </button>
        ))}
      </div>

      <div className="fx-card fx-card-wide">
        <header className="fx-card-head">
          <h3>Commits by weekday and hour</h3>
          <p>{scope.scope.label}</p>
        </header>
        <WorkHeatmap
          key={band}
          heatmap={scope.heatmap}
          bandSize={band === "auto" ? undefined : band}
        />
      </div>
    </Section>
  );
}

function RulesSection() {
  return (
    <Section
      title="What to check"
      note="The four things this page exists to make checkable."
    >
      <ol className="fx-checks">
        <li>
          <strong>A gap month renders as a gap.</strong> December 2025 in the
          mitmproxy charts: line broken, hairline drawn, readout says "No
          eligible records this month". Nothing bridges it, nothing interpolates
          it, and it is never plotted at zero.
        </li>
        <li>
          <strong>The reveal is a wipe over final geometry.</strong> Press
          "Replay the reveals" and watch the left edge: the line is uncovered,
          not drawn, and no point ever passes through a value that was not
          observed. The heatmap's cells fade in at full size on an 8ms column
          sweep.
        </li>
        <li>
          <strong>Reduced motion falls back to a fade.</strong> Turn on the
          system setting (macOS: Accessibility → Display → Reduce motion) and
          replay. The environment strip above reports which mode is active.
        </li>
        <li>
          <strong>The heatmap is keyboard-navigable.</strong> Tab reaches the
          grid as a single stop; arrows move between cells; the readout strip
          announces each one. The monthly charts take ←/→ once the plot has
          focus, and carry step buttons for touch.
        </li>
      </ol>
    </Section>
  );
}

function ChartCard({
  title,
  scope,
  children,
}: {
  title: string;
  scope: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fx-card">
      <header className="fx-card-head">
        <h3>{title}</h3>
        <p>{scope}</p>
      </header>
      {children}
    </div>
  );
}
