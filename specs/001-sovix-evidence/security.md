# Access, Privacy and Threat Model

## Deployment Profiles

Local mode binds to loopback only, uses one local workspace and a random bearer secret in
an owner-readable file. It requires no OIDC or external service for scan/import/report/export.
Do not expose local mode on a LAN. Hosted mode requires TLS, OIDC and database/object-store
credentials. Browser auth uses a BFF: HttpOnly Secure SameSite=Lax session cookie, PKCE/state/
nonce validation, CSRF token for unsafe browser requests, 8-hour absolute and 30-minute idle
session expiration. Browser never stores API bearer tokens in localStorage. Service tokens
are narrowly scoped, hashed at rest, rotated/revoked and cannot invoke user administration.

## Authorization Matrix

| Operation | Owner | Admin | Analyst | Viewer | Collector / worker |
|---|---|---|---|---|---|
| Read project reports/evidence | All | All | Granted projects | Granted aggregate reports; sanitized evidence only | Worker job scope only |
| Read session content (ADR-016; the session's own developer may read it at any internal role) | All | All | Granted projects | Own sessions only; `is_external` never | Coaching and purge jobs only |
| Read another person's coaching (audited per request; no notification) | All | All | Only when the grant covers every project the finding cites | No | No |
| Change coaching model provider (audited configuration change) | Yes | No | No | No | No |
| Import/sync/snapshot/export | Yes | Yes | Granted projects | Download existing authorized exports | Worker scope; collector ingest only |
| Adjudicate links/allocations | Yes | Yes | Granted projects | No | Deterministic adapter only |
| Manage definitions/investigations | Yes | Yes | Granted projects | Read | Scheduler uses definition principal grants |
| Manage members/connectors/collectors | Yes | Yes except owners | No | No | No |
| Change retention/delete project | Yes | Yes | No | No | Purge worker only |
| Activate policy/approve merge action | Yes | Yes | No | No | Action worker uses short-lived host token |
| Transfer/remove last owner | Transfer only | No | No | No | No |
| Read content-free audit | Yes | Yes | No | No | Operators see system health only |

Workspace path IDs are selectors, never authority. JWT claims are validated for issuer,
audience, expiry and signature, then membership/project grants are loaded server-side.
Return 404 for inaccessible resources; return 403 only for a known in-scope resource whose
operation is forbidden. All jobs, caches, indexes and blobs enforce the same checks.

## RLS and Secrets

Hosted app/worker DB roles are non-owner and lack BYPASSRLS. Enable and force RLS on private
tables, set tenant context transaction-locally, clear it on pooled connections and test
background jobs too. Cross-tenant FKs are prohibited. Migration role is separate. Encrypt
hosted objects/backups and use scoped secret-manager references for GitHub/App secrets.
Never put credentials in URLs, job payloads, analytics tables or exports.

## Attribute Allowlist and Session Content

Accept normalized runtime/model/session IDs, normalized repository ID/ref/SHA, timestamps,
token categories, tool name, error class derived from metadata (never from error text),
trace/span IDs and declared capabilities as metadata. Accept prompts, system instructions,
responses, tool arguments/results (the only place file paths appear), session title and raw
error text only as session content (ADR-016): redact credential-shaped strings before storage,
store it apart from span metadata, hard-delete it no later than 30 days after the session ends,
and never copy it into a metric, snapshot, export, event payload, log, audit payload, quarantine
record or search index. HMAC `user.email` into the keyed `identity_digest` at the ingestion
boundary (spec 002) and discard plaintext emails, names, absolute CWD and unknown attributes
before persistence. Collector-side redaction is the first boundary; ingestion repeats it. Do
not retain raw rejected payloads in dead-letter queues. Safe diagnostics contain field paths,
reason codes and counts, not offending values.

Session content is readable by the developer whose linked identity produced the session, by
owner and admin, and by an analyst for sessions in a project inside their grant. Without a
filter a session list holds only the caller's own sessions; these readers list another
developer's sessions one developer per request with that pseudonymous handle, or list
`unattributed=true` sessions with no linked developer and no handle (metadata only, not a person
view, not audited). They read metadata after content expires; nothing orders sessions or
developers by a metric. An internal viewer never reads another person's content and an
`is_external` principal never reads any. Access does not depend on
`individual_attribution_enabled`. Every read request, including an empty or denied one, writes
exactly one `AuditEvent` with actor, subject handle, requested resource, the session IDs returned
(possibly none) and time. It carries no content, is readable by owner and admin only, is never
shown or sent to the subject, and if it fails the read fails. No read notifies the subject. A
local workspace with no hosted account keeps content on the machine. Coaching sends content only
to the workspace's model provider (spec 006), which only the owner changes, audited. Install
output (for developers) and the settings page (for admins) state once that prompts, responses and
tool output are captured and kept up to 30 days; this is a disclosure, not an opt-in or opt-out.

If local identity resolution is required for aggregate people metrics, use tenant-specific
keyed pseudonyms internally and separate keys from analytics storage. Such IDs remain
pseudonymous, not anonymous. No identity filter is available in standard API/report views.
Fixed team/project cohorts require k≥5 distinct humans. Suppress complementary totals and
restrict filter dimensions/time buckets to prevent simple differencing. Administrator
access does not waive standard export suppression.

## Retention and Deletion

| Data | Default | Allowed range | Purge behavior |
|---|---|---|---|
| Normalized spans/session metadata | 60 days from session end (last received span if never finalized) | 7–90 days; always greater than session content | Aggregate snapshots may remain if they carry no governed payload |
| Session content (ADR-016) | 30 days from session end (last received span if never finalized) | 1–30 days; never longer; shortening applies to stored content | Hard delete and destroy its session-end-day key, early when retention is shortened; no role, hold, export or setting extends it; restore re-applies deletion before serving |
| Source evidence / metric snapshots | 365 days | 30–730 days | Expiry revokes dependent drill-down; retained summaries disclose expired evidence |
| Exports | 30 days | 1–90 days | Delete blobs and revoke download records |
| Content-free audits | 365 days | 90–730 days | Purge after configured period |
| Job safe errors | 30 days | 7–90 days | No raw payload in errors |
| Backups | 7 rolling daily backups | Fixed pilot baseline | Tombstones reapplied before restored service is accessible; backups hold content only as ciphertext and never hold keys, so a copy is unreadable once its key is destroyed (crypto-shredding) |

Session content is encrypted under keys scoped per workspace and session-end day. A still-open
session writes under a provisional key and is re-wrapped to its end-day key when it ends, or at
its last received span. Keys live in the secret manager/KMS (OS keychain in local mode), outside every database backup, so a
restored backup brings back ciphertext but never keys. Destroying a day's key at expiry, or early
when retention is shortened, makes every copy of that content unreadable, backups included.
Coaching model text and citation quotes (spec 006 FR-478) are encrypted under the key of their
earliest-expiring cited session.

Project deletion fences writes immediately; target completion ≤24h for initial scale. Keep
a content-free tombstone until the oldest possible backup expires plus 24h. Multi-project
snapshots containing deleted evidence are revoked in full; others' underlying data survives.
User confirmation explains project scope and irreversibility. Already downloaded exports
cannot be remotely erased. No public share links are provided in v1.

## Threats and Required Controls

| Threat | Control | Acceptance probe |
|---|---|---|
| Cross-tenant IDOR | Domain scope + RLS + download gateway | Substitute every resource/job/export ID across two tenants |
| Malicious Git/README text | Treat as data; HTML escape; no tool instructions executed | Commit message containing script/prompt injection renders inert |
| Webhook forgery/replay | Raw-byte HMAC; delivery identity; durable receipt | Modified Unicode bytes fail; redelivery is idempotent |
| SSRF via remote/import | No arbitrary server-side URL import; configured hosts; DNS/IP allowlist | Block loopback/private metadata endpoints in hosted fetches |
| Archive/decompression abuse | 32 MiB decompressed import; 8 MiB trace batch; depth/record limits | Compression bomb/traversal rejected before extraction |
| CSV spreadsheet execution | Escape leading =,+,-,@ and control-prefix cells | Dangerous commit subject exported as literal text |
| Stale policy authorization | ETag + exact SHA + live host checks | Pushed commit invalidates previous pass |
| Export disclosure | Auth on each request; no raw presigned public URL | Membership revoked during render blocks download |
| Privileged job drift | Scoped principal + lease fence + deletion fence | Old worker cannot publish after deletion/revocation |
| Credential leakage | Secret references, redaction, safe audit/error fields | Seeded secret absent in logs, fixtures, artifacts and backups |
| Session content breach | Encryption at rest, forced RLS, content-free logs, 30-day hard deletion | Expired canary content absent from DB, and backup ciphertext undecryptable after key destruction |
| Unauthorized content read | Role/grant/identity-link check on the content route | Viewer, `is_external` and ungranted-analyst probes get 404; every read request, including empty or denied ones, writes one owner/admin-only audit event and no notification |

No general third-party security/compliance certification is claimed. Security acceptance
here is specific to the controls above and requires implementation evidence.
