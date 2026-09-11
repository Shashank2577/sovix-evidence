# ADR-014: PublishedArtifact as a distinct, pseudonymous publication path

**Status**: Accepted for specification | **Date**: 2026-09-12

## Context

The `Export` entity (data-model.md:48) carries the explicit constraint "authorized download
gateway, **no public URLs**", and FR-036 (spec.md:312-313) requires that every download recheck
current project authorization, with revocation overriding link expiry. NFR-008 (spec.md:386-387)
requires exports to be self-contained offline HTML.

A public, anonymously readable dashboard — the intended GitHub Pages deliverable — cannot be an
`Export`. An anonymous static file cannot recheck authorization on read, and cannot honour a later
revocation, because no server mediates the request. Reusing `Export` for publication would either
break its contract or produce a link whose promised revocation semantics are false.

The safe conclusion is that publication is a different act with different guarantees, and should
be a different entity rather than a weakened version of an existing one.

## Decision

Introduce `PublishedArtifact`, separate from `Export`.

Fields beyond scope/ID: `snapshot_id`, `scope_level`, `scope_ids`, `privacy_profile`,
`redaction_version`, `content_digest`, `published_by`, `published_at`, `withdrawn_at` nullable,
`location`.

Rules:

1. **Publication is explicit and per-artifact.** No setting causes automatic publication. A human
   with owner or admin role performs a distinct `publish` action, recorded in the audit log.
2. **`privacy_profile` is mandatory and pseudonymous-or-stricter.** Permitted values are
   `pseudonymous` and `aggregate_only`. There is no `identified` profile. Contributor plaintext
   identity cannot reach a published artifact because it is not in the database to begin with
   (ADR-011), and the HMAC key is never included.
2a. **Repository and path disclosure is explicit.** Private repository names and file paths are
    redacted under `pseudonymous` unless the repository is itself public, in which case its name
    may appear because it is already public information.
3. **Redaction runs as a verified pipeline stage, not a rendering choice.** The publish job
   executes `scan → metrics → redact → render → publish`. The redaction stage emits a manifest
   listing every field class removed. A render MUST NOT be publishable unless the redaction
   manifest is present and its `redaction_version` is current.
4. **Publication is immutable and additive.** Re-publishing writes a new artifact with a new
   `content_digest`. Artifacts are never edited in place, so a reader can verify what was
   published at a point in time.
5. **Withdrawal is honest about its limits.** `withdrawn_at` removes the artifact from its
   location and marks it withdrawn, and the UI MUST state plainly that previously distributed
   copies and search-engine caches cannot be recalled. Withdrawal is not revocation, and the
   product MUST NOT imply that it is.
6. **A published artifact is self-contained.** No remote scripts, styles, fonts or data. This
   extends NFR-008 to publication, so the same renderer serves both the offline export and the
   published page, and there is only one rendering path to test.
7. **Provenance travels with the artifact.** Every published artifact embeds its snapshot digest,
   metric definition versions, window, timezone, coverage summary and redaction version, so a
   reader can tell what it is and what it excludes without access to the system that made it.

`Export` is unchanged. Its "no public URLs" constraint stands, and the two paths never share an
artifact.

## Consequences

- GitHub Pages publication becomes specifiable without weakening the authorization model.
- The renderer must satisfy the stricter of the two contexts, which is publication.
- Rule 5 is a product-honesty requirement with UI copy implications; it is the kind of claim that
  is easy to overstate and expensive to be wrong about.
- A published artifact is a marketing surface as well as a report, so its visual quality is a
  functional requirement rather than a finishing task.

## Alternatives rejected

- **Add a `public` flag to `Export`.** Rejected: silently falsifies FR-036's revocation guarantee.
- **Publish through a server that checks a token.** Rejected: that is a shared link, not a public
  dashboard, and GitHub Pages cannot host it.
- **Redact at render time.** Rejected: makes disclosure a property of a template, where a single
  template mistake leaks data with no verifiable barrier.

## Revisit trigger

A requirement to publish identified data for a public organization that has explicitly consented,
which would need a new privacy profile and a consent record per named individual.
