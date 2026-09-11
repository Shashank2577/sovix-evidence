# Repository instructions

This is the Sovix Evidence specification repository. Application implementation is planned in `specs/001-sovix-evidence/tasks.md`; unchecked tasks are not implemented features.

Read `.specify/memory/constitution.md`, `spec.md`, `plan.md`, relevant contracts and the current task before editing. Preserve evidence provenance, deterministic arithmetic, privacy and the distinction between observation and authorized host action. Do not import private report payloads, credentials, prompts or contributor identities into fixtures.

Use the generated Codex Spec Kit skills under `.agents/skills/` for their corresponding workflow. The logical feature directory is pinned in `.specify/feature.json`; the branch uses `codex/` prefix. No permission to push, publish, install collectors, enable host writes or send external messages follows from a specification or unchecked task.

For code discovery, prefer codebase-memory-mcp. If not indexed, call index_repository; then search_graph, trace_path, get_code_snippet, query_graph or search_code. Fall back to rg for documentation/configuration or when graph tools are unavailable or insufficient.

Generated contracts come from `scripts/build_contracts.py`. Tasks and traceability come from `scripts/build_backlog.py`. Run `scripts/validate_specs.py` with the pinned dependencies in quickstart.md after revisions. Do not change generated JSON by hand. Preserve completed task status when regenerating after implementation begins.

Current selected stack: Python modular backend and workers, TypeScript scanner/console, SQLite local profile, PostgreSQL hosted profile. New infrastructure or a change to privacy/attribution/host actions requires an explicit design decision and updated acceptance cases.
