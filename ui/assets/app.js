/* Sovix — shared runtime. All figures read from window.COHORT; nothing invented. */
(function () {
  "use strict";
  const C = window.COHORT;
  const D = document;

  /* ---------- tiny helpers ---------- */
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  const qs = (name) => new URLSearchParams(location.search).get(name);
  const el = (html) => {
    const t = D.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- scopes ---------- */
  function scopeOrder() {
    const out = [{ key: C.root_scope, label: C.org_label, level: "org" }];
    (C.navigation.projects || []).forEach((p) => {
      out.push({ key: p.key, label: p.label, level: "project" });
      (p.repos || []).forEach((r) => out.push({ key: r.key, label: r.label, level: "repo" }));
    });
    return out;
  }
  const scope = (key) => C.scopes[key];
  const scopeLabel = (key) => {
    const s = scopeOrder().find((x) => x.key === key);
    return s ? s.label : key;
  };
  const scopeHref = (key) => "scope.html?scope=" + encodeURIComponent(key);
  const metricHref = (id, key) =>
    "metric.html?metric=" + encodeURIComponent(id) + "&scope=" + encodeURIComponent(key);
  const metricAt = (key, id) => {
    const s = scope(key);
    return s ? s.metrics.find((m) => m.id === id) : null;
  };

  /* ---------- floors & display ---------- */
  /* A floor means "at least this much of X" -- a coherent claim about a share
     and an incoherent one about a difference. The exporter has attached the
     floor caveat to the signed ai.*_delta metrics, which rendered as
     "≥ −34.4%": a statement that asserts nothing. Deltas are excluded here
     regardless of what their caveats say, so the renderer stays correct even
     against a report that predates the upstream fix. */
  const isDelta = (m) => /_delta$/.test(m.id || "");
  const isFloor = (m) =>
    !isDelta(m) &&
    (/\(floor\)/i.test(m.label || "") ||
      (m.caveats || []).some((c) => /^This is a floor/i.test(c)));
  const isNA = (m) => m.value == null;

  /* Split a display string like "10.7 h" / "7.8%" / "1,936" into number+suffix. */
  function splitDisplay(disp) {
    const m = String(disp).match(/^(-?[\d,]+(?:\.\d+)?)(.*)$/);
    if (!m) return { num: null, suffix: String(disp) };
    return { num: m[1], suffix: m[2] };
  }
  /* Full display with floor prefix. Absence is never zero. */
  function displayOf(m) {
    if (isNA(m)) return "Not available";
    return (isFloor(m) ? "≥ " : "") + m.display;
  }

  /* ---------- series / months (gaps stay gaps) ---------- */
  function monthSeq(a, b) {
    const [ya, ma] = a.split("-").map(Number);
    const [yb, mb] = b.split("-").map(Number);
    const out = [];
    let y = ya, mo = ma;
    while (y < yb || (y === yb && mo <= mb)) {
      out.push(y + "-" + String(mo).padStart(2, "0"));
      mo++;
      if (mo > 12) { mo = 1; y++; }
    }
    return out;
  }
  /* → [{month, value|null, detail|null}] over the continuous month axis */
  function withGaps(points) {
    if (!points || !points.length) return [];
    const map = new Map(points.map((p) => [p.month, p]));
    return monthSeq(points[0].month, points[points.length - 1].month).map((mo) => {
      const p = map.get(mo);
      return p ? { month: mo, value: p.value, detail: p.detail } : { month: mo, value: null, detail: null };
    });
  }
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const shortMonth = (mo) => {
    const [y, m] = mo.split("-");
    return MONTHS[+m - 1] + " ’" + y.slice(2);
  };

  /* ---------- sparkline ---------- */
  function sparkSVG(points, o) {
    o = Object.assign({ w: 150, h: 40, area: true }, o || {});
    const pts = withGaps(points);
    const vals = pts.filter((p) => p.value != null).map((p) => p.value);
    if (vals.length < 2) return "";
    const min = Math.min(...vals, 0 === Math.min(...vals) ? 0 : Math.min(...vals));
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const pad = (hi - lo) * 0.12 || 1;
    const y = (v) => o.h - 3 - ((v - lo + pad * 0.5) / (hi - lo + pad)) * (o.h - 6);
    const x = (i) => (pts.length === 1 ? o.w / 2 : 2 + (i / (pts.length - 1)) * (o.w - 4));
    // build contiguous segments; gaps rendered as dotted connectors
    const segs = [];
    let cur = [];
    pts.forEach((p, i) => {
      if (p.value == null) { if (cur.length) segs.push(cur); cur = []; }
      else cur.push([x(i), y(p.value)]);
    });
    if (cur.length) segs.push(cur);
    let linePaths = "", areaPaths = "", gapPaths = "";
    segs.forEach((seg) => {
      const dseg = seg.map((pt, j) => (j ? "L" : "M") + pt[0].toFixed(1) + " " + pt[1].toFixed(1)).join(" ");
      linePaths += `<path class="line" d="${dseg}"/>`;
      if (o.area && seg.length > 1) {
        areaPaths += `<path class="area" d="${dseg} L${seg[seg.length - 1][0].toFixed(1)} ${o.h} L${seg[0][0].toFixed(1)} ${o.h} Z"/>`;
      }
    });
    for (let i = 0; i < segs.length - 1; i++) {
      const a = segs[i][segs[i].length - 1], b = segs[i + 1][0];
      gapPaths += `<path class="gapline" d="M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}"/>`;
    }
    const last = segs[segs.length - 1];
    const end = last[last.length - 1];
    return `<svg class="spark" viewBox="0 0 ${o.w} ${o.h}" preserveAspectRatio="none" aria-hidden="true">${areaPaths}${gapPaths}${linePaths}<circle class="end-dot" cx="${end[0].toFixed(1)}" cy="${end[1].toFixed(1)}" r="2.4"/></svg>`;
  }

  /* nice round ticks for an axis over [lo, hi] */
  function niceTicks(lo, hi, n) {
    if (hi === lo) hi = lo + 1;
    const step0 = (hi - lo) / Math.max(n, 1);
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const norm = step0 / mag;
    const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
    const out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  }
  const fmtTick = (v) =>
    Math.abs(v) >= 1e6 ? (v / 1e6).toLocaleString("en-US", { maximumFractionDigits: 1 }) + "M"
    : Math.abs(v) >= 1e4 ? Math.round(v / 1e3).toLocaleString("en-US") + "k"
    : Math.abs(v) >= 1e3 ? (v / 1e3).toLocaleString("en-US", { maximumFractionDigits: 1 }) + "k"
    : fmtVal(v);

  /* ---------- monthly bar chart with tooltip; gaps drawn as gaps ----------
     Bars render at their final height immediately: a chart never animates
     its data up from zero. */
  function barChart(container, series, opts) {
    opts = opts || {};
    const pts = withGaps(series.points);
    if (!pts.length) return;
    const W = Math.max(container.clientWidth || 720, 320);
    const H = opts.h || 190;
    const padL = 46, padR = 8, padB = 26, padT = 12;
    const vals = pts.filter((p) => p.value != null).map((p) => p.value);
    const hi = Math.max(...vals) || 1;
    const unitSuffix = { percent: "%", hours: " h", minutes: " min" }[series.unit] || "";
    const ticks = niceTicks(0, hi, 4).filter((t) => t > 0);
    let grid = "";
    ticks.forEach((t) => {
      const gy = H - padB - (t / hi) * (H - padB - padT);
      if (gy < padT - 1) return;
      grid += `<line class="grid" x1="${padL}" y1="${gy.toFixed(1)}" x2="${W - padR}" y2="${gy.toFixed(1)}"/>` +
        `<text class="ytick" x="${padL - 7}" y="${(gy + 3.5).toFixed(1)}">${esc(fmtTick(t))}${unitSuffix}</text>`;
    });
    const iw = (W - padL - padR) / pts.length;
    const bw = Math.min(iw * 0.6, 44);
    let bars = "", labels = "", gaps = "";
    /* label each run of missing months once, at its centre */
    const runs = [];
    let run = null;
    pts.forEach((p, i) => {
      if (p.value == null) { if (!run) run = [i, i]; else run[1] = i; }
      else if (run) { runs.push(run); run = null; }
    });
    if (run) runs.push(run);
    runs.forEach(([a, b]) => {
      const cx = padL + iw * ((a + b) / 2) + iw / 2;
      gaps += `<text class="gap-label" x="${cx}" y="${padT + 8}" text-anchor="middle">no data</text>`;
    });
    pts.forEach((p, i) => {
      const cx = padL + iw * i + iw / 2;
      if (p.value == null) {
        gaps += `<line class="gap-hatch" x1="${cx}" y1="${H - padB - 4}" x2="${cx}" y2="${padT + 16}"/>`;
      } else {
        const h = Math.max(((p.value / hi) * (H - padB - padT)), 1.5);
        bars += `<rect class="bar" tabindex="0" data-i="${i}" x="${(cx - bw / 2).toFixed(1)}" y="${(H - padB - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="2" aria-label="${esc(shortMonth(p.month))}: ${esc(fmtVal(p.value))} ${esc(series.unit || "")}"></rect>`;
      }
      const every = Math.ceil(pts.length / Math.max(4, Math.floor((W - padL - padR) / 76)));
      const last = pts.length - 1;
      if (i === last || (i % every === 0 && last - i >= every))
        labels += `<text x="${cx}" y="${H - 8}" text-anchor="middle">${esc(shortMonth(p.month))}</text>`;
    });
    const svg = el(
      `<div class="mchart-wrap"><svg class="mchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(series.label)} by month">` +
      `${grid}<line class="axis" x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}"/>${bars}${gaps}${labels}</svg>` +
      `<div class="chart-tip" role="status" aria-hidden="true"></div></div>`
    );
    container.appendChild(svg);
    const tip = svg.querySelector(".chart-tip");
    const show = (r) => {
      const i = +r.dataset.i, p = pts[i];
      const extra = p.detail
        ? Object.entries(p.detail).map(([k, v]) => `<span class="dim">${esc(k)}</span> ${esc(fmtVal(v))}`).join("&nbsp;·&nbsp;")
        : "";
      tip.innerHTML = `<b>${esc(shortMonth(p.month))}</b>&nbsp; ${esc(fmtVal(p.value))}${series.unit === "percent" ? "%" : ""}${extra ? "<br>" + extra : ""}`;
      const wrap = svg.getBoundingClientRect(), br = r.getBoundingClientRect();
      tip.style.left = br.left - wrap.left + br.width / 2 + "px";
      tip.style.top = br.top - wrap.top + "px";
      tip.classList.add("show");
    };
    svg.querySelectorAll(".bar").forEach((r) => {
      r.addEventListener("mouseenter", () => show(r));
      r.addEventListener("focus", () => show(r));
      r.addEventListener("mouseleave", () => tip.classList.remove("show"));
      r.addEventListener("blur", () => tip.classList.remove("show"));
    });
  }

  /* ---------- the sample as a part-of-whole ----------
     Counted / each stated exclusion / any remainder the exclusion list does
     not account for. Pie, donut, gauge, radar and treemap are refused: none
     can keep the excluded portion honestly visible. A segmented band can. */
  function segBar(host, s) {
    s = s || {};
    const unit = s.unit || "records";
    if (s.n == null || s.population == null) {
      host.innerHTML = `<p class="covnote">The exporter recorded no sample for this metric.</p>`;
      return;
    }
    const ex = Object.entries(s.excluded || {});
    const exSum = ex.reduce((a, [, v]) => a + (v || 0), 0);
    const rem = Math.max(s.population - s.n - exSum, 0);
    const parts = [{ k: "Counted", v: s.n, cls: "counted" }]
      .concat(ex.map(([k, v], i) => ({ k, v: v || 0, cls: "e" + (i % 3) })))
      .concat(rem > 0 ? [{ k: "In scope but not counted — no exclusion recorded", v: rem, cls: "unrec" }] : []);
    const pctOf = (v) => (s.population ? (v / s.population) * 100 : 0);
    const fmtPct = (v) => {
      const p = pctOf(v);
      return p > 0 && p < 0.1 ? "<0.1%" : fmtVal(+p.toFixed(1)) + "%";
    };
    const segs = parts.filter((p) => p.v > 0).map((p) =>
      `<span class="seg ${p.cls}" style="flex:${p.v} ${p.v} 0%" title="${esc(p.k)} — ${esc(fmtVal(p.v))} ${esc(unit)} (${esc(fmtPct(p.v))})">${
        pctOf(p.v) >= 14 ? `<span class="seg-lb">${esc(fmtPct(p.v))}</span>` : ""}</span>`).join("");
    const legend = parts.map((p) =>
      `<li><span class="sw ${p.cls}"></span><span class="lk">${esc(p.k)}</span><span class="pc">${esc(fmtPct(p.v))}</span><span class="n">${esc(fmtVal(p.v))}</span></li>`).join("");
    const cov = s.coverage_pct;
    host.innerHTML =
      `<div class="cov-line"><span class="cl-big">${esc(fmtVal(s.n))}</span><span class="cl-of">counted of ${esc(fmtVal(s.population))} ${esc(unit)} in scope</span>${
        cov == null ? "" : `<span class="cl-cov num">${esc(fmtVal(cov))}%<span class="k"> coverage</span></span>`}</div>` +
      `<div class="segbar" role="img" aria-label="Of ${esc(fmtVal(s.population))} ${esc(unit)} in scope, ${esc(fmtVal(s.n))} were counted">${segs}</div>` +
      `<ul class="seglegend">${legend}</ul>`;
  }

  /* ---------- position within the cross-scope distribution ----------
     One shared numeric axis; every scope a row; this scope emphasised.
     Absence renders "Not available", never zero and never a dot. */
  function distPlot(host, entries, opts) {
    opts = opts || {};
    const nums = entries.filter((e) => typeof e.value === "number").map((e) => e.value);
    let d0 = Math.min(0, ...(nums.length ? nums : [0]));
    let d1 = Math.max(0, ...(nums.length ? nums : [1]));
    if (d0 === d1) d1 = d0 + 1;
    const trackW = Math.max((host.clientWidth || 620) - 240, 160);
    let ticks = niceTicks(d0, d1, Math.max(3, Math.min(7, Math.floor(trackW / 110))));
    if (nums.length && nums.every(Number.isInteger) && ticks.some((t) => !Number.isInteger(t)))
      ticks = ticks.filter(Number.isInteger);
    const pct = (v) => ((v - d0) / (d1 - d0)) * 100;
    const unitSuffix = opts.unit === "percent" ? "%" : "";
    const axis = nums.length
      ? `<div class="dist-axis" aria-hidden="true"><span></span><span class="ticks">${
          ticks.map((t) => `<span class="tick" style="left:${pct(t).toFixed(2)}%">${esc(fmtTick(t))}${unitSuffix}</span>`).join("")
        }</span><span></span></div>`
      : "";
    const gridImgs = ticks.map((t) => (t === 0 && d0 < 0 ? "linear-gradient(var(--chart-axis), var(--chart-axis))" : "linear-gradient(var(--dist-grid), var(--dist-grid))"));
    const gridPos = ticks.map((t) => pct(t).toFixed(2) + "% 0");
    const trackStyle = nums.length
      ? `background-image:${gridImgs.join(",")};background-position:${gridPos.join(",")};background-size:1px 100%`
      : "";
    const rows = entries.map((e) => {
      const cur = e.current ? " current" : "";
      const dot = typeof e.value === "number"
        ? `<span class="pt" style="left:${pct(e.value).toFixed(2)}%"></span>` : "";
      const val = e.display == null
        ? `<span class="dval na">Not available</span>`
        : `<span class="dval">${esc(e.display)}</span>`;
      return `<a class="drow${cur} lvl-${esc(e.level)}" href="${e.href}"${e.current ? ' aria-current="true"' : ""}>` +
        `<span class="dlabel">${esc(e.label)}</span><span class="track" style="${trackStyle}">${dot}</span>${val}</a>`;
    }).join("");
    host.innerHTML = `<div class="dist${nums.length ? "" : " noscale"}">${axis}${rows}</div>`;
  }

  function fmtVal(v) {
    if (v == null) return "—";
    if (typeof v !== "number") return String(v);
    if (Number.isInteger(v)) return v.toLocaleString("en-US");
    return v.toLocaleString("en-US", { maximumFractionDigits: 1 });
  }

  /* ---------- chips ---------- */
  const tierChip = (m) =>
    `<span class="chip" title="${esc((C.data_quality.tier_legend || {})[m.tier] || "")}"><span class="glyph">◆</span>${esc(m.tier)}</span>`;
  const confChip = (m) =>
    `<span class="chip" title="${esc((C.data_quality.confidence_legend || {})[m.confidence] || "")}"><span class="glyph">${m.confidence === "high" ? "●●●" : m.confidence === "medium" ? "●●○" : "●○○"}</span>${esc(m.confidence)} confidence</span>`;
  const floorChip = (m) =>
    isFloor(m) ? `<span class="chip floor" title="Counts only tools that left a trace. The true figure is higher by an unknown margin.">≥ floor, not a share</span>` : "";

  /* ---------- the window shell: sidebar, toolbar, scroll pane, status bar ---------- */
  const IC = {
    report: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="1.8" width="11" height="12.4" rx="1.6"/><path d="M5.2 5h5.6M5.2 7.6h5.6M5.2 10.2h3.4"/></svg>`,
    org: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3.2" width="12" height="9.6" rx="1.6"/><path d="M2 6.4h12M5.4 3.2v9.6M10.6 6.4v6.4"/></svg>`,
    project: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4.6c0-.9.7-1.6 1.6-1.6h2.6l1.5 1.7h4.7c.9 0 1.6.7 1.6 1.6v5.5c0 .9-.7 1.6-1.6 1.6H3.6c-.9 0-1.6-.7-1.6-1.6V4.6Z"/></svg>`,
    repo: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="4" r="1.7"/><circle cx="5" cy="12" r="1.7"/><circle cx="11.4" cy="6.4" r="1.7"/><path d="M5 5.7v4.6M11.4 8.1c0 2.2-2.2 2.6-4 2.8"/></svg>`,
    work: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="5.2" r="2.6"/><path d="M2.9 13.4c.8-2.3 2.8-3.6 5.1-3.6s4.3 1.3 5.1 3.6"/></svg>`,
    method: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.2"/><path d="M8 7.4v3.4M8 5.1v.1"/></svg>`,
    sidebar: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="1.8" y="3" width="14.4" height="12" rx="2.2"/><path d="M6.8 3v12"/></svg>`,
    disc: `<svg viewBox="0 0 10 10" fill="currentColor" aria-hidden="true"><path d="M3 1.2 8 5 3 8.8z"/></svg>`,
    loupe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>`,
  };

  function sidebarHTML(active, curScope) {
    const row = (href, ic, label, sel) =>
      `<a class="sb-row${sel ? " sel" : ""}" href="${href}" ${sel ? 'aria-current="page"' : ""}><span class="sb-ic">${IC[ic]}</span><span class="sb-lb">${esc(label)}</span></a>`;
    let s = `<a class="sb-app" href="index.html"><span class="mark">S</span><span>Sovix<span class="sub">Engineering evidence</span></span></a>`;
    s += `<nav aria-label="Primary">`;
    s += row("index.html", "report", "The report", active === "report");
    s += `<div class="sb-head">Scopes</div>`;
    s += row(scopeHref(C.root_scope), "org", C.org_label, curScope === C.root_scope);
    (C.navigation.projects || []).forEach((p) => {
      s += `<div class="sb-grp"><div class="sb-grp-row">
        ${row(scopeHref(p.key), "project", p.label, curScope === p.key)}
        <button class="sb-disc" type="button" aria-expanded="true" aria-label="Collapse ${esc(p.label)}">${IC.disc}</button>
      </div><div class="sb-kids">`;
      (p.repos || []).forEach((r) => { s += row(scopeHref(r.key), "repo", r.label, curScope === r.key); });
      s += `</div></div>`;
    });
    s += `<div class="sb-head">Reference</div>`;
    s += row("work.html", "work", "Your work", active === "work");
    s += row("index.html#method", "method", "How it was made", false);
    s += `</nav>`;
    return s;
  }

  let TB = null; // toolbar element, for the title/search helpers

  function header(active) {
    const curScope = active === "ledger"
      ? (qs("scope") && C.scopes[qs("scope")] ? qs("scope") : C.root_scope)
      : null;

    const main = D.getElementById("main");
    const win = el(`<div class="win">
      <aside class="sidebar" id="sidebar">${sidebarHTML(active, curScope)}</aside>
      <div class="pane">
        <header class="toolbar">
          <button class="tb-btn tb-sb" type="button" title="Show or hide the sidebar" aria-label="Show or hide the sidebar" aria-expanded="true">${IC.sidebar}</button>
          <div class="tb-title"><span class="t1"></span><span class="t2"></span></div>
          <div class="tb-right">
            <div class="tb-search" hidden>${IC.loupe}<input type="search"></div>
            <button class="tb-btn theme-toggle" type="button" aria-label="Switch colour theme" aria-pressed="false">
              <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"/></svg>
              <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.4 14.2A8.5 8.5 0 1 1 9.8 3.6a7 7 0 1 0 10.6 10.6Z"/></svg>
            </button>
          </div>
        </header>
        <div class="scroll" id="scrollpane"></div>
        <footer class="statusbar"><span class="page-slot" role="status"></span><span class="sb-meta"></span></footer>
      </div>
    </div>`);
    const scrim = el(`<button class="scrim" type="button" hidden tabindex="-1" aria-label="Close the sidebar"></button>`);
    D.body.prepend(win);
    D.body.appendChild(scrim);
    win.querySelector(".scroll").appendChild(main);
    const skip = el(`<a class="skip" href="#main">Skip to content</a>`);
    D.body.prepend(skip);
    TB = win.querySelector(".toolbar");

    /* sidebar toggle: collapse on wide windows, drawer on narrow ones */
    const tgl = win.querySelector(".tb-sb");
    const narrow = () => matchMedia("(max-width: 900px)").matches;
    const setExpanded = () => {
      const open = narrow() ? win.classList.contains("sb-open") : !win.classList.contains("sb-collapsed");
      tgl.setAttribute("aria-expanded", String(open));
      scrim.hidden = !(narrow() && win.classList.contains("sb-open"));
    };
    tgl.addEventListener("click", () => {
      if (narrow()) win.classList.toggle("sb-open");
      else win.classList.toggle("sb-collapsed");
      setExpanded();
    });
    const closeDrawer = () => { win.classList.remove("sb-open"); setExpanded(); };
    scrim.addEventListener("click", closeDrawer);
    D.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
    matchMedia("(max-width: 900px)").addEventListener("change", () => { win.classList.remove("sb-open"); setExpanded(); });
    /* A first load on a wide window always shows the sidebar — it is what
       makes this a macOS application. Collapse is a within-session choice
       and is deliberately not persisted. */
    if (!narrow()) win.classList.remove("sb-collapsed");
    setExpanded();

    /* project disclosure triangles */
    win.querySelectorAll(".sb-disc").forEach((b) => {
      b.addEventListener("click", () => {
        const grp = b.closest(".sb-grp");
        const closed = grp.classList.toggle("closed");
        b.setAttribute("aria-expanded", String(!closed));
        b.setAttribute("aria-label", (closed ? "Expand " : "Collapse ") + b.getAttribute("aria-label").replace(/^(Expand|Collapse) /, ""));
      });
    });

    /* theme toggle */
    const btn = win.querySelector(".theme-toggle");
    const setPressed = () =>
      btn.setAttribute("aria-pressed", D.documentElement.dataset.theme === "dark" ? "true" : "false");
    setPressed();
    btn.addEventListener("click", () => {
      const cur = D.documentElement.dataset.theme === "dark" ? "light" : "dark";
      D.documentElement.dataset.theme = cur;
      try { localStorage.setItem("sovix-theme", cur); } catch (e) {}
      setPressed();
    });
    // enable colour transitions only after first paint (no theme flash)
    requestAnimationFrame(() => requestAnimationFrame(() => D.body.classList.add("theme-anim")));

    /* default window title */
    const defaults = { report: "The report", ledger: "The ledger", work: "Your work" };
    toolbarTitle(defaults[active] || "Sovix", curScope ? scopeLabel(curScope) : "");
  }

  /* window title in the toolbar: title line + small subtitle line */
  function toolbarTitle(t, sub) {
    if (!TB) return;
    TB.querySelector(".tb-title .t1").textContent = t || "";
    const t2 = TB.querySelector(".tb-title .t2");
    t2.textContent = sub || "";
    t2.style.display = sub ? "" : "none";
  }

  /* reveal the toolbar search field; returns its <input> */
  function toolbarSearch(placeholder, label) {
    const wrap = TB.querySelector(".tb-search");
    wrap.hidden = false;
    const input = wrap.querySelector("input");
    input.placeholder = placeholder || "Search";
    input.setAttribute("aria-label", label || placeholder || "Search");
    return input;
  }

  /* left slot of the status bar — item counts, Finder-style */
  function statusSlot(text) {
    const slot = D.querySelector(".statusbar .page-slot");
    if (slot) slot.textContent = text || "";
  }

  /* the status bar's standing metadata (was the web footer) */
  function colophon() {
    const col = C.collection || {};
    const meta = D.querySelector(".statusbar .sb-meta");
    if (!meta) return;
    meta.innerHTML = `
      <span class="mid">Generated <span class="num">${esc((C.generated_at || "").slice(0, 10))}</span></span>
      <span class="wide">Collected in <span class="num">${esc(fmtVal(col.duration_seconds))}s</span> · <span class="num">${esc(fmtVal(col.graphql_calls))}</span> GraphQL + <span class="num">${esc(fmtVal(col.rest_calls))}</span> REST calls · <span class="num">${esc(fmtVal(col.llm_calls))}</span> LLM calls</span>
      <span>Every figure shows its working — no score, no grade, no ranking of people.</span>`;
  }

  /* ---------- reveal on scroll + count-up ---------- */
  function revealInit() {
    const els = D.querySelectorAll(".rv");
    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add("in");
          io.unobserve(en.target);
        });
      },
      /* list containers can be far taller than the viewport, so reveal on
         first visible pixel rather than a fraction of the whole element */
      { threshold: 0, rootMargin: "0px 0px -4% 0px" }
    );
    els.forEach((e) => io.observe(e));
  }

  /* A figure is a claim; it never animates up from zero. Markup that still
     carries data-countup simply renders its final text. */
  function countUp(node) {
    node.textContent = node.dataset.countup;
  }

  /* ---------- exports ---------- */
  window.SVX = {
    C, esc, qs, el, reduced,
    scopeOrder, scope, scopeLabel, scopeHref, metricHref, metricAt,
    isFloor, isNA, displayOf, splitDisplay,
    withGaps, shortMonth, sparkSVG, barChart, segBar, distPlot, fmtVal,
    tierChip, confChip, floorChip,
    header, colophon, revealInit, countUp,
    toolbarTitle, toolbarSearch, statusSlot,
  };
})();
