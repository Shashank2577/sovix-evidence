/**
 * The Overview screen (SPEC §5.1) — C6.
 *
 * One screen, four variants: the organisation greeting, the project read, the
 * repository's "Inside this repository", and the hero's empty variant where the
 * rulebook ran and nothing fired. Composed from the chunks beneath it — the
 * integrity primitives (C3), the chart kit (C4) and the working drawer's URL
 * contract (C5) — and it renders no figure it computed itself.
 */

export { default as Overview, type OverviewProps } from "./Overview";
export {
  greetingFor,
  heroFindings,
  signalMetricIds,
  topExemplars,
  REPO_SIGNAL_FALLBACK,
  SIGNAL_METRIC_IDS,
  type Greeting,
  type WeightedExemplar,
} from "./derive";
export { firstSentence } from "./FindingHero";
