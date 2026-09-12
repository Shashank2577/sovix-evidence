"""Stylesheet, generated from tokens.py so there is one source of truth.

The output is inlined into the artifact. It references no remote asset: leak
test LT-04 fails the build if a url() with a non-data scheme appears here.

Fonts are a deliberate exception in structure but not in policy. The published
artifact embeds subsetted WOFF2 as data URIs via `font_face_block`. When no
font payload is supplied the stylesheet falls back to the system stacks
declared in tokens, which still renders correctly, only less well.
"""

from __future__ import annotations

from . import tokens as T


def font_face_block(faces: dict[str, bytes] | None) -> str:
    """@font-face rules with each face embedded as a data URI.

    `faces` maps a CSS family name to WOFF2 bytes. Passing None emits nothing
    and the system fallback stacks apply. The caller is responsible for the
    220KB budget; render.py asserts it.
    """
    if not faces:
        return "/* no embedded faces: system fallback stacks apply */"

    import base64

    out = []
    for family, payload in faces.items():
        b64 = base64.b64encode(payload).decode("ascii")
        out.append(
            f"@font-face{{font-family:'{family}';font-display:swap;"
            f"src:url(data:font/woff2;base64,{b64}) format('woff2')}}"
        )
    return "\n".join(out)


def stylesheet() -> str:
    ts = T.TYPE_SCALE

    def t(name: str) -> str:
        fam, weight, size, line, extra = ts[name]
        css = f"font-family:{fam};font-weight:{weight};font-size:{size}px;line-height:{line/size:.3f}"
        return css + (";" + extra if extra else "")

    return f""":root{{
  --canvas:{T.CANVAS}; --surface:{T.SURFACE}; --recessed:{T.RECESSED};
  --ink:{T.INK}; --ink-2:{T.INK_2}; --ink-3:{T.INK_3};
  --accent:{T.ACCENT}; --accent-active:{T.ACCENT_ACTIVE};
  --rule:{T.RULE}; --hairline:{T.HAIRLINE}; --error:{T.ERROR};
  --d1:{T.DATA_RAMP[0]}; --d2:{T.DATA_RAMP[1]}; --d3:{T.DATA_RAMP[2]};
  --d4:{T.DATA_RAMP[3]}; --d5:{T.DATA_RAMP[4]}; --d6:{T.DATA_RAMP[5]};
  --motion:{T.MOTION_MS}ms;
}}

*{{box-sizing:border-box}}

/* The artifact commits to one printed look. The viewer's theme does not
   recolour an instrument: a report that changed palette between readers
   could not be compared to its own printout. Every colour is therefore
   painted explicitly and no theme query exists. */
html{{background:var(--canvas)}}
body{{
  margin:0; background:var(--canvas); color:var(--ink);
  {t("body")}
  font-variant-numeric:tabular-nums;
  -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility;
}}

.wrap{{max-width:{T.MAX_CONTENT_WIDTH}px;margin:0 auto;padding:{T.GUTTERS[1200]}px}}
@media(max-width:1199px){{.wrap{{padding:{T.GUTTERS[768]}px}}}}
@media(max-width:767px){{.wrap{{padding:{T.GUTTERS[0]}px}}}}

/* ── type scale ───────────────────────────────────────────────────────── */
.t-display1{{{t("display-1")};margin:0;text-wrap:balance}}
.t-display2{{{t("display-2")};margin:0;text-wrap:balance}}
.t-heading{{{t("heading")};margin:0}}
.t-title{{{t("title")};margin:0}}
.t-meta{{{t("meta")};color:var(--ink-3)}}
.t-label{{{t("label")};color:var(--ink-3)}}
.t-data-xl{{{t("data-xl")}}}
.t-data{{{t("data")}}}
.t-mono{{{t("mono")}}}
p.t-body{{{t("body")};max-width:{T.MAX_MEASURE_CH}ch}}

/* ── structure: hairlines, not boxes ──────────────────────────────────── */
section{{padding-top:{T.SECTION_RHYTHM}px;margin-top:{T.SECTION_RHYTHM}px;
  border-top:1px solid var(--hairline)}}
section.first{{border-top:none;margin-top:0}}

/* The double rule appears exactly twice per report and marks the boundaries
   of the certified surface. Reusing it elsewhere is a spec violation. */
.doublerule{{border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);
  height:2px;margin:0}}

.sechead{{display:flex;align-items:baseline;gap:{T.SPACE[3]}px;flex-wrap:wrap;
  margin-bottom:{T.SPACE[1]}px}}

/* ── masthead ─────────────────────────────────────────────────────────── */
.masthead{{display:flex;justify-content:space-between;align-items:flex-end;
  gap:{T.SPACE[5]}px;flex-wrap:wrap;margin-bottom:{T.SPACE[3]}px}}
.scopebar{{display:flex;gap:{T.SPACE[4]}px;flex-wrap:wrap;margin:{T.SPACE[3]}px 0}}
.scopebar>div{{font-size:14px;color:var(--ink-2)}}
.scopebar b{{display:block;{t("label")};color:var(--ink-3);margin-bottom:2px}}

/* ── cards ────────────────────────────────────────────────────────────── */
.cards{{display:grid;grid-template-columns:repeat(auto-fill,minmax(272px,1fr));
  gap:{T.SPACE[4]}px;margin-top:{T.SPACE[4]}px}}
.cards.wide{{grid-template-columns:repeat(auto-fill,minmax(340px,1fr))}}
.card{{background:var(--surface);border:1px solid var(--hairline);
  padding:{T.SPACE[4]}px;display:flex;flex-direction:column;gap:{T.SPACE[2]}px;
  min-height:168px}}
@media(max-width:767px){{.card{{padding:{T.CARD_PADDING_NARROW}px}}}}
.card h3{{{t("title")};margin:0}}
.val{{display:flex;align-items:baseline;gap:{T.SPACE[1]}px;flex-wrap:wrap}}
.den{{font-size:14px;color:var(--ink-2)}}
.quals{{display:flex;gap:6px;flex-wrap:wrap;margin-top:auto;align-items:center}}
.explain{{font-size:14px;color:var(--accent);text-decoration:none;
  border-bottom:1px solid currentColor}}
.explain:hover{{color:var(--accent-active)}}

/* ── evidence chip: kind is the left rule's style ─────────────────────── */
.chip{{display:inline-flex;align-items:center;gap:5px;{t("label")};
  color:var(--ink-2);background:var(--recessed);padding:3px 7px 3px 6px}}
.chip::before{{content:"";width:0;height:11px;border-left-width:3px;
  border-left-color:var(--ink-2)}}
.chip.measured::before{{border-left-style:solid}}
.chip.proxy::before{{border-left-style:dashed}}
.chip.inferred::before{{border-left-style:dotted}}
.chip.unavail{{color:var(--ink-3)}}
.chip.unavail::before{{border-left-style:solid;border-left-color:var(--hairline)}}

/* ── absence ──────────────────────────────────────────────────────────── */
.absent{{border:1px solid var(--hairline);background:var(--recessed);
  padding:12px 14px;font-size:14px;color:var(--ink-2)}}
.absent strong{{color:var(--ink);font-weight:600;display:block;margin-bottom:2px}}

/* ── tables are the accessible source for every chart ─────────────────── */
details{{margin-top:{T.SPACE[2]}px;border-top:1px solid var(--hairline);
  padding-top:10px}}
summary{{{t("label")};color:var(--ink-3);cursor:pointer}}
summary:hover{{color:var(--ink-2)}}
.tblwrap{{overflow-x:auto;margin-top:10px}}
table{{border-collapse:collapse;width:100%;font-size:14px}}
th,td{{text-align:right;padding:5px 10px;border-bottom:1px solid var(--hairline);
  white-space:nowrap}}
th:first-child,td:first-child{{text-align:left;white-space:normal}}
thead th{{background:var(--recessed);{t("label")};color:var(--ink-3)}}
td.na,.na{{color:var(--ink-3)}}

/* ── charts ───────────────────────────────────────────────────────────── */
figure{{margin:0}}
svg.chart{{display:block;width:100%;height:auto;overflow:visible}}
figcaption{{font-size:14px;color:var(--ink-2);margin-top:10px;
  max-width:{T.MAX_MEASURE_CH}ch}}
.chartblk{{margin-top:{T.SPACE[4]}px}}

/* ── findings ─────────────────────────────────────────────────────────── */
.findings{{margin-top:{T.SPACE[4]}px}}
.finding{{display:grid;grid-template-columns:96px 1fr;gap:{T.SPACE[4]}px;
  padding:18px 0;border-bottom:1px solid var(--hairline)}}
.finding:first-child{{border-top:1px solid var(--hairline)}}
.finding h4{{{t("heading")};margin:0 0 4px}}
.finding p{{margin:0;font-size:15px;color:var(--ink-2);max-width:68ch}}
.finding .sev{{{t("label")};color:var(--ink-3);padding-top:6px}}
.rule-cite{{{t("mono")};color:var(--ink-3);margin-top:8px;display:block}}
@media(max-width:600px){{.finding{{grid-template-columns:1fr;gap:6px}}}}

/* ── footer / provenance ──────────────────────────────────────────────── */
.foot{{margin-top:{T.SPACE[6]}px;padding-top:{T.SPACE[4]}px;
  border-top:1px solid var(--hairline);font-size:14px;color:var(--ink-3);
  max-width:{T.MAX_MEASURE_CH}ch}}
.foot b{{color:var(--ink)}}
.foot code{{{t("mono")};color:var(--ink-2)}}

a{{color:var(--accent)}}
:focus-visible{{outline:2px solid var(--accent);outline-offset:2px}}

@media(prefers-reduced-motion:reduce){{*{{animation:none!important;
  transition:none!important}}}}

@media print{{
  .wrap{{max-width:none;padding:0}}
  details{{display:block}} details>summary{{display:none}}
  .card{{break-inside:avoid}} section{{break-inside:auto}}
}}
"""
