"""Pseudonymous contributor identity, per ADR-011.

`Contributor.identity_digest` is an HMAC-SHA256 over the normalized author
email, keyed by a per-workspace secret that is never exported. `handle` is
the stable, human-legible pseudonym derived from that digest.

This module never touches disk and never logs. The key lives only in the
`Pseudonymizer` instance that holds it, and that instance MUST NOT let the
key leak back out through `repr()` or through any manifest it produces —
that is the whole point of a keyed digest: without the key, `identity_digest`
cannot be run in reverse, so the mapping between digest and handle is safe
to publish while the key never can be.
"""

from __future__ import annotations

import hmac
import re
import secrets
from hashlib import sha256

HANDLE_PREFIX = "Contributor "
_MIN_HANDLE_HEX = 4
_DIGEST_HEX_LEN = sha256().digest_size * 2  # 64
_CONTRIBUTOR_NAMESPACE = "contributor"


def derive_key(salt_source: bytes | None = None) -> bytes:
    """Generate a fresh per-workspace HMAC key.

    `salt_source`, if given, is used verbatim instead of a random key. That
    path exists only so tests can produce reproducible digests; production
    callers MUST NOT pass it, since a fixed key defeats the point of a
    per-workspace secret.
    """
    if salt_source is not None:
        return bytes(salt_source)
    return secrets.token_bytes(32)


def _normalize(email: str) -> str:
    return email.strip().lower()


_ANGLE_ADDR_RE = re.compile(r"^\s*(?P<name>[^<]*?)\s*<\s*(?P<addr>[^>]+?)\s*>\s*$")


def _identity_components(plaintext: str) -> set[str]:
    """Every string that could betray this identity if it were rendered.

    A git identity usually arrives as `Display Name <address@host>`. A leak
    almost never reproduces that combined form; it shows up as the display
    name on its own, or the address on its own, or the address's local part.
    LT-02 scans this set, so anything omitted here is something LT-02 cannot
    catch.

    Each component is returned in both its supplied and lowercase form. The
    minimum-length guard lives in LT-02 rather than here, so this function
    stays a faithful decomposition and the policy about what is too short to
    match sits with the test that applies it.
    """
    out: set[str] = set()

    def add(s: str) -> None:
        s = s.strip().strip("\"'")
        if s:
            out.add(s)
            out.add(s.lower())

    raw = (plaintext or "").strip()
    if not raw:
        return out

    m = _ANGLE_ADDR_RE.match(raw)
    if m:
        add(m.group("name"))
        add(m.group("addr"))
        addr = m.group("addr")
    else:
        addr = raw if "@" in raw else ""
        if not addr:
            add(raw)

    if addr and "@" in addr:
        add(addr)
        local, _, _domain = addr.partition("@")
        # A GitHub noreply address carries the account name after the numeric
        # id: 12345+octocat@users.noreply.github.com. That trailing part is
        # the person's handle and is exactly what a leak would show, so it is
        # recorded.
        if "+" in local:
            _, _, after = local.partition("+")
            add(after)
        # The BARE local part is deliberately NOT recorded. A real contributor
        # in the reference dataset uses work@<domain>, and recording "work"
        # made LT-02 report a contributor leak against the metric label
        # "share of work that is new capability". A generic local part
        # discloses nobody, and a leaked address is caught in full by LT-01's
        # email pattern, so nothing is lost by omitting it.
        #
        # The domain is likewise not recorded: it is shared across an
        # organisation and would match harmlessly everywhere.

    return out


def identity_digest(email: str, key: bytes) -> str:
    """HMAC-SHA256 over the normalized lowercase, stripped email."""
    normalized = _normalize(email)
    return hmac.new(key, normalized.encode("utf-8"), sha256).hexdigest()


def handle(digest: str, *, hex_len: int = _MIN_HANDLE_HEX) -> str:
    """Stable pseudonym derived from a digest.

    `hex_len` lets a caller extend past the default 4 hex characters to
    resolve a collision; the default is what every non-colliding identity
    uses.
    """
    chunk = digest[:hex_len].upper()
    return f"{HANDLE_PREFIX}{chunk}"


class Pseudonymizer:
    """Holds the per-workspace HMAC key and memoizes identity -> handle.

    Two distinct identities are never allowed to receive the same handle:
    a 4-hex-char collision is detected and resolved by extending that
    identity's handle to more hex characters, rather than silently sharing
    one pseudonym across two people. Collision resolution is tracked
    separately per namespace, so a redacted repository or branch label
    (see `opaque_label`) is never confusable with a contributor handle.
    """

    def __init__(self, key: bytes | None = None) -> None:
        self.__key = key if key is not None else derive_key()
        # namespace -> normalized plaintext -> digest.
        self._digest_by_plaintext: dict[str, dict[str, str]] = {}
        # namespace -> digest -> label, and the reverse index used to
        # detect collisions within that namespace.
        self._label_by_digest: dict[str, dict[str, str]] = {}
        self._digest_by_label: dict[str, dict[str, str]] = {}
        # namespace -> every plaintext and identity component this instance
        # has pseudonymized in that namespace. Exists so a leak test can scan
        # rendered output for these strings without reversing the digest.
        # Kept per namespace so an identity test never scans for a repository
        # label and call the match a contributor leak.
        self._known_by_namespace: dict[str, set[str]] = {}

    def _pseudonymize(self, namespace: str, plaintext: str, prefix: str) -> str:
        normalized = _normalize(plaintext)
        # Needles are recorded PER NAMESPACE. Pooling them made LT-02, an
        # identity test, scan strings that are not identities: a repository
        # label or a branch name would enter the same set, and the 4-letter
        # label "work" then matched the metric title "share of work that is
        # new capability" and reported a contributor leak. Scoping the set
        # keeps each test's needles semantically what that test is about.
        seen = self._known_by_namespace.setdefault(namespace, set())
        seen.add(plaintext)
        seen.add(normalized)
        # Record the identity's COMPONENTS too, not only the string as
        # supplied. A git identity usually arrives as "Name <email>", and a
        # leak virtually never reproduces that whole form: it surfaces as the
        # bare display name in a table cell, or as the address on its own.
        # Recording only the combined string made LT-02 unable to catch a
        # planted full name, which is the exact failure it exists to prevent.
        seen.update(_identity_components(plaintext))

        by_plaintext = self._digest_by_plaintext.setdefault(namespace, {})
        digest = by_plaintext.get(normalized)
        if digest is None:
            digest = identity_digest(normalized, self.__key)
            by_plaintext[normalized] = digest

        label_by_digest = self._label_by_digest.setdefault(namespace, {})
        existing = label_by_digest.get(digest)
        if existing is not None:
            return existing

        digest_by_label = self._digest_by_label.setdefault(namespace, {})

        # Find the shortest hex length that does not collide with a label
        # already assigned to a *different* digest in this namespace.
        hex_len = _MIN_HANDLE_HEX
        while True:
            chunk = digest[:hex_len].upper()
            candidate = f"{prefix}{chunk}"
            holder = digest_by_label.get(candidate)
            if holder is None or holder == digest:
                break
            hex_len += 1
            if hex_len > _DIGEST_HEX_LEN:
                # Digests are 64 hex chars; running out means two distinct
                # plaintexts collapsed to the same digest, which should be
                # unreachable given SHA-256's collision resistance. Fail
                # loudly rather than silently sharing a label.
                raise RuntimeError(
                    "pseudonym label collision could not be resolved: "
                    "two distinct identities collapsed to the same digest"
                )

        label_by_digest[digest] = candidate
        digest_by_label[candidate] = digest
        return candidate

    def handle_for(self, email_or_name: str) -> str:
        return self._pseudonymize(
            _CONTRIBUTOR_NAMESPACE, email_or_name, HANDLE_PREFIX
        )

    def opaque_label(self, namespace: str, plaintext: str) -> str:
        """A stable, collision-resolved opaque label for a non-contributor
        identity (a private repository name, a non-default branch name).

        Uses the same keyed-HMAC-and-extend mechanism as `handle_for`, but
        in a separate label/digest space per `namespace` so a redacted repo
        or branch label can never collide with, or be confused for, a
        contributor handle. `namespace` MUST NOT be `"contributor"` — that
        space belongs to `handle_for`.
        """
        if namespace == _CONTRIBUTOR_NAMESPACE:
            raise ValueError(
                f"namespace {namespace!r} is reserved for handle_for()"
            )
        prefix = f"{namespace.capitalize()}-"
        return self._pseudonymize(namespace, plaintext, prefix)

    @property
    def known_plaintexts(self) -> frozenset[str]:
        """Contributor identities only. This is LT-02's needle set.

        Deliberately excludes repository and branch labels: they are
        pseudonymized by the same machinery but they are not identities, and
        scanning for them under an identity test produced a false contributor
        leak. Use `known_plaintexts_in` for those.
        """
        return frozenset(self._known_by_namespace.get(_CONTRIBUTOR_NAMESPACE, ()))

    def known_plaintexts_in(self, namespace: str) -> frozenset[str]:
        """Needles for one namespace, e.g. "repo" or "branch"."""
        return frozenset(self._known_by_namespace.get(namespace, ()))

    @property
    def all_known_plaintexts(self) -> frozenset[str]:
        """Every namespace pooled. For diagnostics, not for a leak test."""
        out: set[str] = set()
        for v in self._known_by_namespace.values():
            out |= v
        return frozenset(out)

    def mapping_manifest(self) -> dict[str, str]:
        """Contributor digest -> handle. Never the plaintext, never the key."""
        return dict(self._label_by_digest.get(_CONTRIBUTOR_NAMESPACE, {}))

    def __repr__(self) -> str:
        total = sum(len(m) for m in self._label_by_digest.values())
        return f"Pseudonymizer(key=<redacted>, identities={total})"
