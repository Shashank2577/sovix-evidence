# Feature Specification: Publish Pipeline and Installation

**Feature Branch**: `codex/004-publish-pipeline`

**Created**: 2026-09-12

**Status**: Specified; implementation not started

**Input**: Specify the `scan → metrics → redact → render → publish` pipeline that produces a
`PublishedArtifact` (ADR-014) for GitHub Pages, and the installation/first-run experience for
an individual, a self-hosting team and an enterprise.

## Context

This feature has two parts that share one constraint: everything it produces or installs must
be safe and simple by default. Part 1 specifies the pipeline that turns an internal `Snapshot`
into a `PublishedArtifact` a stranger can read without an account, and the verified redaction
step that makes that safe (ADR-014, ADR-011). Part 2 specifies how a user gets from "nothing
installed" to "first report," for three audiences, with the fewest possible steps and none of
the side effects a predecessor tool caused (silent telemetry, clobbered Git hooks).

`Export` (data-model.md:48, FR-036) is unchanged by this feature and remains the only path for
an authorized, revocable, private download. `PublishedArtifact` is anonymous, public and
immutable once written; the two paths never share an artifact (ADR-014).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Publish a project report publicly (Priority: P1)

An owner selects a snapshot and a privacy profile and publishes it. A stranger with the URL
opens it later with no login and no relationship to the workspace.

**Why this priority**: This is the feature's core deliverable; nothing else in this spec matters
if publication itself does not work end to end.

**Independent Test**: A fixture workspace with one private and one public repository publishes
a snapshot under `pseudonymous`, and the resulting artifact opens with no server, no account and
no network, showing evidence, provenance and no contributor plaintext identity.

**Acceptance Scenarios**:

1. **Given** a ready snapshot and an owner or admin session, **when** `publish` is invoked with
   an explicit `privacy_profile`, **then** the pipeline runs `scan → metrics → redact → render →
   publish` in order and a `PublishedArtifact` with a `location` exists only if every stage
   completes and every leak test passes.
2. **Given** a snapshot spanning one private and one public repository, **when** published under
   `pseudonymous`, **then** the public repository's name appears in the artifact and the private
   repository's name does not.
3. **Given** a completed publish, **when** the artifact is opened offline (networking disabled),
   **then** it renders fully, including its provenance block, using no remote script, style,
   font or data reference.
4. **Given** an analyst role (not owner/admin), **when** `publish` is invoked, **then** the
   action is refused and no artifact, manifest or audit record beyond the refusal is created.

---

### User Story 2 - Verify what was removed before trusting a publish (Priority: P1)

A security-conscious owner or an external auditor inspects the redaction manifest for a
published artifact and confirms exactly what field classes were removed or transformed, and
that every leak test passed.

**Why this priority**: Publication is only trustworthy if redaction is independently checkable;
this is what separates a verified pipeline stage from a rendering choice ADR-014 rejected.

**Independent Test**: A fixture snapshot containing at least one instance of every field class
in the redaction table (below) is published; the resulting manifest lists a rule and a
before/after instance count for each class, and every leak test in FR-205 records a pass.

**Acceptance Scenarios**:

1. **Given** a published artifact, **when** its manifest is opened, **then** `redaction_version`,
   `privacy_profile`, every field class evaluated with its rule and instance counts, and every
   leak test's id and result are present.
2. **Given** a manifest, **when** its digest is recomputed from its own content, **then** the
   recomputed digest equals `manifest_digest` on the `PublishedArtifact`.
3. **Given** a redaction ruleset change after a render but before publish, **when** publish is
   attempted, **then** the stale render is rejected and redaction re-runs against the current
   ruleset before any artifact is written.
4. **Given** any single leak test failing, **when** publish runs, **then** no `PublishedArtifact`
   is created, the failure names the failing test id and field path (never the offending value),
   and the attempt is retained as an internal, unpublished manifest record.

---

### User Story 3 - Withdraw a published artifact (Priority: P2)

An owner withdraws a previously published artifact after realizing the scope was wrong.

**Why this priority**: Withdrawal is the one action that can partially undo publication, and its
limits must be both real and honestly presented (ADR-014 rule 5).

**Independent Test**: A published artifact is withdrawn; its `location` stops serving content
within the documented propagation bound, the UI states the distributed-copy and cache limitation
verbatim, and the `PublishedArtifact` row persists with `withdrawn_at` set.

**Acceptance Scenarios**:

1. **Given** a published artifact, **when** an owner withdraws it, **then** its files are removed
   from the publication target and `withdrawn_at`/`withdrawn_by` are recorded.
2. **Given** a withdrawn artifact's original URL, **when** requested after propagation completes,
   **then** it resolves to a withdrawal notice, not the original content and not a generic 404.
3. **Given** a withdrawal in progress, **when** the UI confirms it, **then** the confirmation text
   states plainly that already-distributed copies and search-engine caches cannot be recalled.
4. **Given** a withdrawn artifact, **when** an owner republishes the same scope, **then** a new
   `PublishedArtifact` with a new `content_digest` is created; the withdrawn record is not reused
   or edited in place.

---

### User Story 4 - Read an artifact's provenance without system access (Priority: P2)

A reader with only the published URL determines what the artifact covers, what it excludes and
how current it is, without contacting the originating system.

**Why this priority**: ADR-014 rule 7 makes provenance a functional requirement, not a footnote;
a report a reader cannot date or scope is not evidence.

**Independent Test**: A published artifact opened offline shows its snapshot digest, metric
definition versions, window with timezone, coverage summary and redaction version in one visible
location, matching the values in its own manifest.

**Acceptance Scenarios**:

1. **Given** an open artifact, **when** its provenance block is read, **then** snapshot digest,
   metric versions, window, timezone, coverage summary and redaction version are all present.
2. **Given** two artifacts published from different snapshots of the same scope, **when**
   compared, **then** their provenance blocks differ and each is internally self-consistent.
3. **Given** an artifact whose coverage was partial at snapshot time, **when** opened, **then**
   the provenance block states the partial coverage; it is not silently presented as complete.

---

### User Story 5 - Individual gets a first local report (Priority: P1)

A developer with a laptop, no account and no prior relationship to the product installs the CLI
and produces a report from a local repository.

**Why this priority**: This is the smallest, most frequent path and the one most sensitive to
friction; SC-001 (spec 001) already requires five minutes offline, and this story adds the exact
command count that makes that achievable.

**Independent Test**: On a clean machine with only the stated prerequisite installed, the two
commands in FR-214/FR-215 run in sequence, produce a self-contained local HTML report, and make
no network request after the install step.

**Acceptance Scenarios**:

1. **Given** a clean machine with the stated Node.js prerequisite present, **when** the install
   command runs, **then** the CLI is available on `PATH` with no configuration file written.
2. **Given** an installed CLI and a local Git repository, **when** the single quickstart command
   runs with no flags, **then** a self-contained HTML report is produced and its path is printed.
3. **Given** networking disabled after install, **when** quickstart runs, **then** it completes
   with no network request and no account prompt.
4. **Given** the Node.js prerequisite is missing, **when** the install command is attempted,
   **then** the failure names the missing prerequisite and the exact command to obtain it.

---

### User Story 6 - Team stands up a self-hosted workspace (Priority: P2)

A small team runs the hosted product on its own infrastructure and produces its first
team-scoped report with real repository access.

**Why this priority**: Self-hosting is the path that unlocks FR-013–FR-036's workspace
capabilities without a vendor-hosted account.

**Independent Test**: The step sequence in FR-216, run against a fixture GitHub repository,
reaches a rendered team report with exactly the step count in the Installation Paths table.

**Acceptance Scenarios**:

1. **Given** the published Compose file and an `.env` copied from `.env.example` with no edits,
   **when** `docker compose up -d` runs, **then** the stack starts and prints a loopback-safe or
   configured URL; no step requires editing application source.
2. **Given** a first visit to that URL, **when** the owner completes first-run setup, **then** a
   workspace and an owner membership exist per FR-013, matching security.md's authorization model.
3. **Given** a connected repository, **when** the owner requests a report, **then** the same
   evidence contract as the local CLI path applies (spec 001 FR-007).
4. **Given** a port already bound on the host, **when** `docker compose up -d` fails, **then**
   the failure names the conflicting port and service, not a generic startup error.

---

### User Story 7 - Enterprise installs under its own identity and policy controls (Priority: P2)

An enterprise administrator adds organization SSO, a scoped GitHub App, retention limits and
governance controls on top of the self-hosted base before any team uses it.

**Why this priority**: Enterprise adoption requires the controls in FR-013–FR-042 to be
reachable through a bounded, documented sequence, not ad hoc configuration.

**Independent Test**: The step sequence in FR-217, run against a fixture OIDC provider and a
fixture GitHub organization, reaches a governed first report with the documented step count,
excluding external approval wait time.

**Acceptance Scenarios**:

1. **Given** OIDC client credentials and a redirect URI, **when** configured, **then** browser
   sign-in follows the BFF/PKCE flow in security.md with no bearer token reaching the browser.
2. **Given** an org-scoped GitHub App installation, **when** repositories are selected, **then**
   collection is read-only and revocable per FR-015, independent of any publish credential.
3. **Given** a retention policy set within the bounds in security.md, **when** saved, **then**
   the next purge time is visible per FR-037.
4. **Given** the same base steps as Story 6 plus the three enterprise-specific steps, **when**
   counted, **then** the total does not exceed the bound in the Installation Paths table.

---

### User Story 8 - Diagnose a failing or empty install (Priority: P2)

A user points the CLI at a repository that is empty, shallow, unusually large or produces no
eligible evidence, and needs to know why and what to do next without reading source code.

**Why this priority**: An installation that fails silently or unexplainably is indistinguishable
from a broken product; this closes the most common first-run support burden.

**Independent Test**: A fixture matrix of an empty repository, a depth-1 shallow clone, a
repository exceeding the documented size guidance and an all-bot-commit repository each produce
a labeled cause and a labeled next action, verified against the matrix.

**Acceptance Scenarios**:

1. **Given** a repository with zero commits in the resolved window, **when** quickstart runs,
   **then** it exits 0, states zero eligible records with cause "no commits in window" and
   suggests widening `--since`, and does not exit as a failure.
2. **Given** a shallow clone, **when** scanned, **then** the report labels history coverage as
   limited by shallow depth rather than presenting it as complete history.
3. **Given** a repository whose size exceeds the documented single-pass guidance, **when**
   quickstart's default window is applied, **then** the tool states the narrowed default window
   and the flag to override it, rather than exhausting memory or hanging silently.
4. **Given** a repository whose only commits are from bot patterns, **when** reported, **then**
   agent-signature and people metrics show their unavailable/floor state per constitution II,
   not a numeric zero.

---

### User Story 9 - Uninstall completely (Priority: P3)

A user removes the CLI and, if they choose, all local state it created, and confirms nothing
remains.

**Why this priority**: An incomplete uninstall is a trust cost even when nothing else about the
product misbehaves; it is lower priority than first-run because it is a less frequent action.

**Independent Test**: After install, quickstart and an explicit data purge, a full filesystem
diff against the pre-install state shows no residual files outside what the user was told would
remain, and no background process is left running.

**Acceptance Scenarios**:

1. **Given** an installed CLI with local state, **when** the package is uninstalled, **then** the
   binary is removed and no daemon or background process continues running.
2. **Given** local state still present after package uninstall, **when** the documented purge
   command runs, **then** it lists every path it will delete before deleting, requires
   confirmation, and requires no network.
3. **Given** a `sovix serve` process still bound to loopback, **when** uninstall or purge is
   attempted, **then** the running process is named and the user is told to stop it first (or it
   is stopped) rather than leaving an orphaned lock on the state directory.

---

### Edge Cases

- A publish request's snapshot is deleted or retention-expired between request and pipeline
  start; the publish MUST fail closed with a named cause, never publish from stale cached content.
- The redaction ruleset version changes between render and the publish write; the stale render
  MUST be discarded and redaction MUST re-run (Story 2, Scenario 3).
- Two concurrent publish requests target the same `scope_level`/`scope_ids`; the "latest" pointer
  update MUST be a single atomic write, never a last-write-wins race that silently drops one.
- A withdrawal is requested while a publish for the same scope is still writing; the withdrawal
  MUST be sequenced after the in-flight write completes, not interleaved with it.
- A workspace scope has no public repositories at all; the pipeline MUST NOT default to treating
  any repository as public absent an explicit `visibility=public` value.
- GitHub Pages CDN propagation lags the pointer update; a withdrawn artifact may still be served
  for a bounded window. The withdrawal UI's honesty statement (Story 3, Scenario 3) MUST cover
  this propagation lag in addition to already-distributed copies.
- The install machine has no Node.js runtime at all, or a version older than the stated baseline;
  the failure MUST name the exact missing/insufficient prerequisite and remediation command.
- A self-host Docker Compose run hits a port already bound on the host (Story 6, Scenario 4).
- An enterprise network blocks arbitrary outbound HTTPS; local report generation (Story 5, 8)
  MUST remain fully usable, because its network dependency is isolated to the install step, and
  is entirely independent of the publish pipeline's network dependency (Story 1).
- `sovix serve` or another sovix process holds the local state directory lock during uninstall
  or purge (Story 9, Scenario 3).

## Requirements *(mandatory)*

### Functional Requirements

#### Publish pipeline and the `PublishedArtifact` entity

- **FR-200**: Publishing MUST be an explicit, per-artifact action available only to a workspace
  owner or admin (security.md authorization matrix), distinct from `Export`, and MUST record an
  `AuditEvent` (extends FR-018) naming the actor, scope, `privacy_profile` and result.
- **FR-201**: `privacy_profile` MUST be present on every publish request and MUST be exactly
  `pseudonymous` or `aggregate_only`. No `identified` value MUST ever be accepted at the API
  boundary or persistable in storage (defense in depth: validated in both places).
- **FR-202**: The publish job MUST execute `scan → metrics → redact → render → publish` in that
  order for every publish request. `render` MUST NOT proceed unless a `RedactionManifest` exists
  for the same snapshot and `privacy_profile`, every field-class verdict in it is `pass`, and its
  `redaction_version` equals the currently active ruleset version; a stale or absent manifest
  MUST re-run `redact` before `render` proceeds.
- **FR-203**: The redaction stage MUST apply exactly the rules in the Redaction Rules table
  below, per field class and per `privacy_profile`. No field class outside that table's coverage
  and the free-text allowlist rule (row 9) MUST reach a rendered artifact.
- **FR-204**: The redaction stage MUST emit a `RedactionManifest` recording: `redaction_version`,
  `ruleset_digest`, `privacy_profile`, one result per field class (rule applied, instances
  removed, instances transformed, verdict), one result per leak test (FR-205) with pass/fail and
  execution time, and a `digest` over that content. An auditor MUST be able to verify what was
  removed from this manifest alone, without access to the source snapshot.
- **FR-205**: The publish job MUST run every leak test in the table below against the rendered
  artifact before writing a `PublishedArtifact`. Any single failure MUST block publication; the
  failure record MUST name the test id and the field path, and MUST NOT include the offending
  value (matching security.md's safe-diagnostic convention).

  | ID | Check | Mechanism | On failure |
  |---|---|---|---|
  | LT-01 | No email-shaped string | RFC 5322-pattern scan of all rendered text and JSON values | Block publish |
  | LT-02 | No unhashed contributor name | Case-insensitive substring match of rendered text against every source contributor display name/email local-part in the snapshot's input set | Block publish |
  | LT-03 | No absolute filesystem path | Pattern scan for OS path prefixes (`/Users/`, `/home/`, `~/`, drive-letter paths, UNC paths) in all rendered text and JSON | Block publish |
  | LT-04 | No remote asset reference | Zero `<script>`, `<link>`, `<img>`, `@font-face` or CSS `url()` referencing a non-`data:` scheme; zero non-relative `http(s)://` executable reference | Block publish |
  | LT-05 | No HMAC key or secret material | Known-secret-pattern and high-entropy-token scan of all rendered bytes | Block publish |
  | LT-06 | No non-allowlisted free text | Every rendered field key MUST appear on the render schema's structured-field allowlist; anything else is a leak test failure, not a warning | Block publish |
  | LT-07 | Manifest integrity | Recomputed digest of `RedactionManifest` content equals its own recorded `digest` | Block publish |
  | LT-08 | No private repository identity | Every rendered repository reference resolves to either `visibility=public` or an opaque per-artifact label; no `canonical_remote`/`host_repo_id` of a private repository appears | Block publish |
  | LT-09 | No raw branch name | Every rendered branch reference is either the public repository's `default_branch` or an opaque per-artifact label | Block publish |
  | LT-10 | Cohort/aggregate-only enforcement | Under `aggregate_only`, zero per-contributor rows exist; under `pseudonymous`, every contributor breakdown has ≥5 distinct `Contributor` rows (constitution III, security.md k≥5) | Block publish |
  | LT-11 | Current ruleset | `RedactionManifest.redaction_version` equals the currently deployed redaction ruleset version at publish time | Block publish |

- **FR-206**: Every `PublishedArtifact` MUST embed, in its rendered content, its snapshot digest,
  metric definition versions, event-time window with timezone, coverage summary and
  `redaction_version` (ADR-014 rule 7), matching the same values recorded on the entity and in
  the manifest.
- **FR-207**: `PublishedArtifact` rows MUST be immutable and additive. Re-publishing the same
  `scope_level`/`scope_ids` MUST create a new row with a new `content_digest`, MUST set
  `supersedes_id` to the prior artifact for that scope when one exists, and MUST NOT edit or
  delete the prior row's content.
- **FR-208**: A private repository's name and file paths MUST be redacted under both privacy
  profiles unless the repository's `visibility` is `public`, in which case its name and tracked
  paths MAY appear (ADR-014 rule 2a; Redaction Rules table rows 2–3).
- **FR-209**: Withdrawing a `PublishedArtifact` MUST set `withdrawn_at` and `withdrawn_by`, MUST
  remove its files from the publication target, and MUST leave the row itself intact as an
  auditable record that publication occurred. Every withdrawal confirmation MUST state, verbatim
  or in substantively equivalent language, that previously distributed copies and search-engine
  caches cannot be recalled (ADR-014 rule 5), and MUST additionally disclose the propagation
  bound in FR-211e.
- **FR-210**: A `PublishedArtifact` MUST be self-contained: no remote script, style, font or data
  reference of any kind. The same renderer that produces an offline `Export` (NFR-008) MUST
  produce the artifact rendered for publication, so there is exactly one rendering path to test
  against the stricter of the two contexts (ADR-014 rule 6 and consequence).

#### Redaction Rules

| Field class | `pseudonymous` | `aggregate_only` | Reason |
|---|---|---|---|
| Contributor identity | Replaced by a stable pseudonymous handle (`Contributor <hex4>`, ADR-011); breakdowns shown only where the cohort has ≥5 distinct humans | No per-contributor row exists; only rollup counts | `identity_digest`'s HMAC key is never exported (ADR-011); an un-suppressed small cohort makes ranking-by-exclusion possible |
| Repository name | Shown only if `visibility=public`; otherwise an opaque per-artifact label | Always an opaque label or omitted; only cross-repository rollups | ADR-014 rule 2a: private names are proprietary, public names are already public |
| File path | Shown only within a public repository; otherwise reduced to file extension/category with no directory structure | Never shown; only file-category aggregate counts | Directory structure discloses architecture beyond what a bare repository name reveals; grouped with repository name under rule 2a |
| Branch name | Repository's `default_branch` MAY appear; every other branch replaced by an opaque per-artifact label | No branch-level entity appears | Non-default branch names routinely embed usernames, ticket IDs or codenames regardless of repository visibility |
| Commit message | Full text never included; only structured derivatives (conventional-commit type, length bucket, aggregate counts) | Same as pseudonymous | Free-form commit text is the highest-probability carrier of secrets, internal names and PII (extends data-model.md:13-14's source-body prohibition to anything rendered externally) |
| PR title | Full text never included; only structured category/state fields (merged/closed, size bucket, review-cycle count) | Same as pseudonymous | Same rationale as commit messages; titles routinely name customers or internal projects |
| URL | A URL to a public resource (the public repository itself, or a public PR/issue on it) MAY appear as plain non-executing text; any other URL is stripped | No URL of any kind appears | ADR-014 rule 6 (no remote references) and rule 2a (public information is already public); an internal URL discloses infrastructure topology |
| Timestamp granularity | Coarsened to calendar date (UTC), no time-of-day; the artifact's own window boundaries retain full precision as artifact metadata, not personal data | Coarsened to the reporting period only; no per-event dates | Fine-grained per-event timestamps let a reader infer an individual's working hours, timezone or location |
| Free text (any other narrative field) | Excluded by default; only fields on the render schema's structured-field allowlist may appear | Same as pseudonymous | An allowlist is the only design a leak test (LT-06) can mechanically verify; a denylist is defeated by any new free-text field added later |

#### GitHub Pages publication target

- **FR-211**: A publish job MUST target GitHub Pages using the layout and rules below.
  - **FR-211a**: Path scheme is `/{scope_level}/{scope_ids-derived opaque key}/{content_digest}/`,
    containing exactly `index.html` (the rendered artifact) and `manifest.json` (the
    `RedactionManifest`). No other files MUST exist under that path.
  - **FR-211b**: Re-publishing MUST write a new versioned path under FR-211a and MUST update a
    separate scope-level `latest` pointer to reference it; it MUST NOT overwrite or delete a
    prior versioned path.
  - **FR-211c**: The `latest` pointer update and the new versioned path write MUST be committed
    as a single atomic operation against the publication target, so a concurrent reader never
    observes a pointer referencing a path that does not yet exist.
  - **FR-211d**: Path segments MUST use opaque scope identifiers, never repository or project
    names, unless that name is already permitted to appear under FR-208.
  - **FR-211e**: Withdrawal MUST delete the versioned path's files and MUST clear or redirect the
    `latest` pointer for that scope. The publication target's CDN/build propagation delay MUST be
    documented as a stated bound (for example, "up to the next Pages build") and disclosed per
    FR-209.
- **FR-212**: Credentials used to write to the GitHub Pages target MUST be held by a distinct
  `Connector` of kind `github_pages`, separate from any read-only collection connector for the
  same workspace, so publish credentials and collection credentials can be rotated or revoked
  independently (least privilege, consistent with security.md's scoped-credential pattern).
- **FR-213**: Publish and withdraw actions MUST each emit an `AuditEvent` (extends FR-018) with
  actor, scope, `content_digest` (publish) or `withdrawn_at` (withdraw), and result.

#### Installation and first run

- **FR-214**: Installing the CLI on a supported platform MUST be completable with exactly one
  command (for example, a global package-manager install), and MUST additionally support a
  zero-persistent-install path (for example, a package-manager run-once invocation) that performs
  the equivalent of install-then-run in one command for a user who does not want a lasting global
  install. Both paths MUST require network access only for that one command; every command in
  FR-215 that follows MUST make no network request.
- **FR-215**: A new single command (for example `sovix quickstart [PATH]`) MUST scan the given
  local repository (`PATH` defaulting to `.`), build a report and export a self-contained HTML
  report to a default local path, printing that path, with zero required flags, no account, no
  configuration file and no network access. It MUST use a stated default time window (for
  example, a fixed recent period) and MUST print that resolved window explicitly. This command is
  additive to, and MUST NOT replace, the explicit `scan`/`report`/`export`/`--start`/`--end`
  contract in contracts/cli.md, which remains available for scripted and CI use.
- **FR-216**: A team self-hosting path MUST be documented as a fixed, minimized step sequence
  using the Docker Compose baseline (plan.md), covering: obtaining the Compose file, producing a
  working `.env` from a committed example with no required edits to start, starting the stack,
  completing first-owner setup (FR-013) and connecting one repository (FR-015). The exact step
  count MUST match the Installation Paths table below.
- **FR-217**: An enterprise installation path MUST be documented as the team path in FR-216 plus
  exactly three additional mandatory steps: OIDC provider configuration, GitHub App/collector
  registration at organization scope (FR-019), and retention policy configuration within the
  bounds in security.md (FR-037). SSO group-to-role mapping and publish-connector configuration
  (FR-212) MAY be additional steps but MUST NOT be counted as mandatory to reach a first report.
- **FR-218**: No command in this feature MUST transmit telemetry about the user, their
  repository, or their usage by default. Any future opt-in telemetry requires a separate,
  explicit, audited consent action and is out of scope for this feature.
- **FR-219**: No command in this feature MUST write outside its declared state, configuration or
  output directories (the local state directory in contracts/cli.md, the current working
  directory for explicit `--output` targets, and nothing else).
- **FR-220**: No command in this feature MUST install, modify or write any file under
  `.git/hooks/`. Any future feature that installs a Git hook MUST preserve pre-existing hook
  content (by chaining to it or refusing with an explicit conflict, never truncating it) and
  requires its own ADR before shipping; this feature installs none.
- **FR-221**: When a CI environment is detected (a documented environment variable such as `CI`)
  or `--non-interactive` is passed, no command in this feature MUST block on an interactive
  prompt; any input that would otherwise be prompted for MUST instead fail fast, naming the flag
  that supplies it.
- **FR-222**: Every failure and every degraded-but-successful state (empty repository, shallow
  clone, oversized repository triggering a narrowed default window, no eligible evidence) MUST
  print a stable cause and an explicit next action on the primary output channel for the active
  `--format`. No command in this feature MUST terminate with an unlabeled stack trace as its only
  output.
- **FR-223**: A documented uninstall procedure MUST remove the installed package with one
  package-manager command and MUST provide a separate explicit purge step that lists every local
  state path it will delete, requires confirmation, requires no network, and leaves no residual
  file outside the paths it listed. If a `sovix serve` process holds the state directory, the
  purge step MUST name that process and refuse (or stop it) rather than corrupt or silently skip.

### Non-Functional Requirements

- **NFR-050**: For fixed `snapshot_id`, `redaction_version` and `privacy_profile`, the redact and
  render stages MUST be deterministic: repeated runs produce the same `content_digest` (extends
  NFR-008's determinism to the publish path).
- **NFR-051**: The one-command install (FR-214) MUST complete using only the target platform's
  package manager and a documented disk footprint; it MUST NOT require compiling from source or
  installing an unrelated runtime not already declared in plan.md's technical context.
- **NFR-052**: Beyond the single network fetch in FR-214 and the explicit GitHub Pages write in
  FR-211, no command in this feature MUST make any outbound network request; this is
  mechanically verifiable by running each command with networking blocked and asserting success
  or an explicit, documented network-required failure only for the publish command.
- **NFR-053**: Every command in this feature MUST behave identically whether or not a TTY is
  attached, except for interactive confirmation prompts explicitly gated by FR-221.
- **NFR-054**: A repeated purge (FR-223) or a purge run when no state exists MUST be idempotent
  and MUST NOT error merely because there is nothing left to delete.
- **NFR-055**: A rendered `PublishedArtifact` MUST meet the same accessibility bar as an `Export`
  (NFR-005), inherited automatically because FR-210 requires one shared renderer for both.

## Key Entities

Extends the Entity Catalog in data-model.md; conventions (scope columns, immutable-record fields)
match that document.

| Entity | Required fields beyond scope/ID | Relationships and constraints |
|---|---|---|
| PublishedArtifact | workspace_id, project_id nullable, snapshot_id, scope_level, scope_ids, privacy_profile, redaction_version, manifest_digest, content_digest, published_by, published_at, withdrawn_at nullable, withdrawn_by nullable, location, supersedes_id nullable, schema_version | Unique workspace_id+content_digest; immutable and additive (FR-207); privacy_profile never `identified`; withdrawn_at set removes files at `location` but the row persists (FR-209) |
| RedactionManifest | workspace_id, snapshot_id, privacy_profile, redaction_version, ruleset_digest, field_class_results, leak_test_results, generated_at, digest | One per publish attempt, including failed attempts; every field_class_results and leak_test_results entry MUST be `pass` before a PublishedArtifact referencing it may be created (FR-204, FR-205) |

`Connector` (data-model.md:27) gains one additional `kind` value, `github_pages`, scoped to
publish credentials only (FR-212); no new fields are required on the existing entity.

## Success Criteria *(mandatory)*

### Installation Paths

| Persona | Steps to first report | Network required | Time target |
|---|---:|---|---|
| Individual (laptop) | 2 (install, quickstart) | Install step only | ≤5 minutes (extends spec 001 SC-001 with an exact step count) |
| Team (self-host) | 5 (get Compose file, prepare `.env`, start stack, first-owner setup, connect one repository) | Start-up and repository connection only | ≤15 minutes, excluding external GitHub App approval wait |
| Enterprise | 8 (team's 5 plus OIDC config, GitHub App org registration, retention policy) | Same as team, plus OIDC/App round trips | ≤1 engineering-hour, excluding external approval wait |

### Measurable Outcomes

- **SC-001**: The individual path in the Installation Paths table completes in exactly the listed
  step count with zero configuration files and zero network requests after the install step.
- **SC-002**: The team and enterprise paths complete in the listed step counts against a fixture
  OIDC provider and fixture GitHub organization, with no step requiring an undocumented action.
- **SC-003**: 100% of leak tests (FR-205) pass on every fixture artifact in the golden publish
  fixture set before any `PublishedArtifact` is created; a single failing test blocks 100% of
  attempted publishes in the fixture set, with zero false negatives against seeded leaks.
- **SC-004**: 100% of withdrawal actions in the fixture set remove the artifact's files from the
  publication target within the documented propagation bound.
- **SC-005**: A full filesystem diff after install, quickstart and purge shows zero residual paths
  outside those the purge step listed, across the fixture matrix in Story 9.
- **SC-006**: Every fixture in the failure/diagnostic matrix (empty, shallow, oversized, no
  eligible evidence) produces a labeled cause and a labeled next action; zero fixtures produce an
  unlabeled error or a silent zero where an unavailable state was correct.
- **SC-007**: Re-publishing the same scope 100 times in the fixture set produces 100 immutable,
  distinct `content_digest` values with no prior versioned path ever overwritten.

## Assumptions

- GitHub Pages is the only publication target specified here; other static hosts are a future,
  separately ADR-gated extension.
- The CLI's package registry/name used in FR-214's example commands is illustrative; the final
  registry namespace is an implementation decision, not a specification commitment.
- The zero-persistent-install path in FR-214 assumes the Node.js baseline in plan.md's technical
  context is already present; installing that runtime itself is outside this feature's scope.
- Docker Compose remains the documented self-host baseline per plan.md; a managed/Kubernetes
  deployment uses the same OCI images but is not separately step-counted here.
- A future opt-in local Git hook integration is out of scope for this feature and requires its
  own ADR before any `.git/hooks/` write is permitted, per FR-220.
- Provisioning the `github_pages` connector's credential (deploy key versus a scoped GitHub App
  installation) is an implementation decision deferred to planning, not fixed by this spec.
- The Installation Paths table's time targets exclude third-party approval latency (GitHub App
  organization approval, OIDC provider provisioning) that this feature does not control.
