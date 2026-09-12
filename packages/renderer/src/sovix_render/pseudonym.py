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
        # what this instance has ever pseudonymized, verbatim. Exists so a
        # leak test (LT-02) can scan rendered output for these exact strings
        # without needing to reverse the digest.
        self._known_plaintexts: set[str] = set()

    def _pseudonymize(self, namespace: str, plaintext: str, prefix: str) -> str:
        normalized = _normalize(plaintext)
        self._known_plaintexts.add(plaintext)
        self._known_plaintexts.add(normalized)

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
        return frozenset(self._known_plaintexts)

    def mapping_manifest(self) -> dict[str, str]:
        """Contributor digest -> handle. Never the plaintext, never the key."""
        return dict(self._label_by_digest.get(_CONTRIBUTOR_NAMESPACE, {}))

    def __repr__(self) -> str:
        total = sum(len(m) for m in self._label_by_digest.values())
        return f"Pseudonymizer(key=<redacted>, identities={total})"
