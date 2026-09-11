# Quickstart

## Available now: specification validation

Requires Python 3.12+ and `uv`; Node and Docker are not needed to validate this specification repository. Commands are run from the repository root. The validator dependencies are pinned for repeatable document validation; application dependencies are selected during M0.

```sh
cd '/Users/shashanksaxena/Documents/ChatGPT/Git ai'
python3 scripts/build_contracts.py
python3 scripts/build_backlog.py
uv run --no-project --with openapi-spec-validator==0.7.2 --with jsonschema==4.23.0 python scripts/validate_specs.py
bash .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
git diff --check
```

The first validation invocation may download tools. Subsequent offline use requires the uv cache already populated. Application offline operation is a separate M1 acceptance requirement; the validator is not the application.

Expected result: valid OpenAPI/JSON Schemas and examples, 138 unique acyclic task IDs, all 82 requirements/criteria mapped, no broken authored relative document links, and Spec Kit prerequisite discovery. See [validation.md](validation.md) for actual execution results.

## Continue with Spec Kit

The initialized Codex integration exposes `$speckit-constitution`, `$speckit-specify`, `$speckit-plan`, `$speckit-tasks`, `$speckit-analyze` and `$speckit-implement`. Read the relevant `.agents/skills/speckit-*/SKILL.md` before invoking. The constitution, specification, plan, research, data model, contracts, quickstart and task backlog have already been written; do not overwrite them with empty generated templates.

Use `$speckit-analyze` for a read-only consistency review. Start implementation with M0 followed by US1 and US2 only. Update checklist status only after the actual implementation and its acceptance evidence exist. The generator owns task text and traceability; preserve task completion state when revising the generator after work starts.

## Planned M1 demonstration

These commands are the target CLI interface, **not runnable application commands in this repository yet**:

```sh
sovix scan ./example-repository --start 2026-08-01T00:00:00Z --end 2026-09-01T00:00:00Z --format json
sovix import ./legacy-report.json --format receipts_1_0
sovix report --start 2026-08-01T00:00:00Z --end 2026-09-01T00:00:00Z --timezone UTC --output ./snapshot.json
sovix export --snapshot ./snapshot.json --format html --output ./report.html
sovix verify review.recorded_coverage --snapshot ./snapshot.json --format json
```

The reference repository/report must be synthetic or explicitly selected by the user. No private source reports are bundled here. The exact canonical metric IDs are defined in metrics.md; adapters preserve legacy identifiers under a separate namespace.

The demo must run with application networking blocked, produce honest unavailable telemetry/production states, show coverage and arithmetic, and open the portable report without remote assets. It must not silently upload Git history or install an agent collector.

## Planned hosted evaluation

After M2 implementation, configure OIDC, a dedicated PostgreSQL application role without owner/BYPASSRLS rights, private object storage and a read-only GitHub App installation. An administrator selects repositories and registers a metadata-only collector explicitly. Use synthetic telemetry first, then separately authorize real source collection. Production actions remain disabled until M4 acceptance and shadow qualification.

No credentials, cloud deployments, remote Git repositories or host write permissions are created by this specification setup.
