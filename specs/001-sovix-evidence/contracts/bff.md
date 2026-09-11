# Browser BFF Contract

## Boundary

The hosted Next.js console uses a same-origin backend-for-frontend (BFF). The browser authenticates
to the BFF with one opaque session cookie; the BFF holds OIDC and API credentials server-side,
adds the audience-bound API bearer token and proxies only declared `/v1` operations. Browser
code never receives or stores OIDC access/refresh tokens, API bearer tokens, connector secrets,
object-store credentials or presigned public URLs.

The local profile does not use OIDC. Its console is loopback-only and receives the local bearer
secret through the local server process, never by embedding it in exported HTML or a URL.

## OIDC Flow

| Browser route | Method | Behavior |
|---|---|---|
| `/auth/login` | GET | Start authorization-code flow for a validated same-origin return path |
| `/auth/callback` | GET | Validate response, establish server-side session, rotate cookie, redirect |
| `/auth/session` | GET | Return display identity, authorized workspace summaries, expiry and CSRF token |
| `/auth/logout` | POST | Require CSRF, revoke server session, clear cookie and redirect same-origin |
| `/bff/v1/*` | Matching REST method | Enforce session/CSRF, proxy an allowlisted API operation and filter headers |

Login generates one-time 256-bit state and nonce plus a PKCE verifier; the authorization request
uses `S256`. State, nonce, verifier, issuer and exact return path are stored server-side and
expire after 10 minutes. Callback requires exact state, issuer, audience, nonce, signature and
time validation, and a one-time authorization code. Return paths must start with `/` and resolve
to the same origin; absolute, scheme-relative and encoded cross-origin redirects are rejected.

Account identity is `(issuer,subject)`. Email or display label is not authority. After token
validation the API loads current memberships and project grants server-side. Login does not
create access to a workspace except when the explicit create-workspace operation creates its
owner membership transactionally.

## Session Cookie and Lifetime

The hosted cookie is `__Host-sovix_session`, contains only a random 256-bit opaque handle, and
is set with `Secure; HttpOnly; SameSite=Lax; Path=/` and no `Domain`. The server stores session
identity, encrypted token material, creation, last activity, absolute expiry, idle expiry,
authorization epoch and CSRF binding. Responses containing session or identity state use
`Cache-Control: no-store, private` and `Vary: Cookie`.

Sessions expire eight hours after login regardless of activity and after 30 minutes idle.
Eligible activity updates idle expiry at most once per five minutes to limit writes; polling
health alone does not extend a session. The handle rotates after callback, privilege-sensitive
reauthentication and any detected fixation risk. Sign-out, owner/admin revocation, OIDC token
revocation or authorization-epoch mismatch invalidates it server-side immediately. Expired
requests return 401 and the BFF never serves cached private content.

OIDC refresh occurs server-side only when needed and cannot extend the eight-hour absolute
limit. Refresh failure clears the session. Tokens and claims are redacted from logs, errors,
HTML, JavaScript bundles and browser storage.

## CSRF and Browser Request Rules

`/auth/session` returns a random CSRF token bound to the server session and authorization
epoch. It is intentionally readable by the active page but is not an authentication credential.
The console keeps it in memory only and sends it as `X-CSRF-Token` on POST, PUT, PATCH and
DELETE requests, including logout. The BFF compares it in constant time, validates `Origin`
against the configured exact origin (and `Sec-Fetch-Site` when supplied), and rejects absent or
mismatched values with 403 `csrf_failed` before forwarding. A token rotates with the session
and expires with it.

GET/HEAD must remain read-only and need no CSRF token. The BFF accepts JSON only for REST
mutations except declared binary/import routes, rejects simple form posts, and applies body
limits before parsing. CORS is disabled for credentialed BFF routes. Content Security Policy
disallows remote scripts and object embedding; frame ancestors are denied. User-controlled
repository text is escaped as data and never inserted as executable HTML.

The BFF forwards `Idempotency-Key`, `If-Match`, safe content negotiation and an accepted UUID
`X-Request-ID`. It strips browser-supplied Authorization, Cookie, forwarding, host, internal
scope and service-token headers, then constructs trusted upstream headers. Response filtering
removes upstream cookies, authorization, secret references, internal addresses and raw object
keys. Errors retain the API's safe `application/problem+json` shape.

## Downloads, Secrets and Caching

Export download requests traverse the BFF/API authorization gateway. Membership, project grant,
snapshot lifecycle and deletion/revocation state are checked at request time and again before
streaming begins. The browser receives a streamed attachment, not a reusable object-store URL.
Private API, identity, export and error responses use `Cache-Control: no-store`; the service
worker does not cache authenticated routes. The back/forward cache is cleared on logout and
private pages revalidate before revealing content.

Connector configuration responses expose redacted fields and capabilities only. A user never
receives a stored credential reference's value. On an explicit collector-create action, an
authorized owner/admin may receive the generated ingest token exactly once. That response is
`no-store`, the UI warns that it cannot be retrieved, and browser code neither logs nor writes
it to local/session storage. Copying or downloading it is a deliberate user action.

## Public Discovery and Watchlist

Public RepoRadar profile/search calls use the unauthenticated public API and have no access to
the BFF's private database/session context. Public and private data stores, credentials, caches
and indexes are separate. A private workspace identifier is never accepted as a public filter.

The watchlist is browser-local only. It stores a versioned JSON object under
`sovix.radar.watchlist.v1` in `localStorage` with unique public repository IDs and `updated_at`;
the maximum is 500 entries. It contains no access token, workspace/project ID, private
repository, profile snapshot or user identity, performs no server synchronization and is
cleared through an explicit local control. If storage is unavailable, the watchlist works in
memory for the current tab and explains that it will not persist. Public request publication is
a separate authenticated, preview-and-confirm flow and never attaches watchlist or private
report content.

## BFF Acceptance

- Authorization code interception, altered state/nonce, expired flow, bad audience/issuer and
  cross-origin return paths fail without creating a session.
- Browser storage, page source, bundles, logs and network responses contain no OIDC/API token,
  connector secret or object-store URL; the opaque cookie is HttpOnly.
- Every unsafe operation fails without the current CSRF token or exact Origin and succeeds with
  both; GET routes produce no mutation.
- Idle, absolute, logout and membership-revocation tests remove access immediately, including
  downloads and history navigation.
- Cross-tenant path/cursor/job/export substitution returns indistinguishable 404 responses.
- The public watchlist persists only public repository IDs locally, works without sign-in and
  never syncs into private services.
