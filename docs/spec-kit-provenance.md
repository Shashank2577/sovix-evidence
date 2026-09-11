# Spec Kit provenance

Created on 2026-09-11 using the official [GitHub Spec Kit v1.0.0](https://github.com/github/spec-kit/tree/v1.0.0) at commit `bca679051abb80d6cf0cd909f2539a28a10eb7eb`.

The initialization command, executed from the parent ChatGPT folder, was:

```sh
uvx --from 'git+https://github.com/github/spec-kit.git@v1.0.0' specify init 'Git ai' --integration codex --integration-options='--skills' --script sh --non-interactive
```

The official scaffold includes `.agents/skills/speckit-*`, `.specify/templates`, `.specify/scripts`, presets and workflow metadata. Project-specific constitution and feature documents were then authored from the analyzed sources. The bundled template examples remain upstream scaffolding, not project requirements or unfinished application tasks.

Feature directory: `specs/001-sovix-evidence`, resolved through `.specify/feature.json`. Git branch: `codex/001-sovix-evidence`; there is no need to rename it to the feature directory name. Template resolution and plan/task setup scripts were used; no extension hook configuration was present.

Authored files express the completed constitution/specification/planning/tasks stages. The application implementation stage has not run. The standalone validation script checks contracts, examples and coverage; it does not simulate a successful application acceptance run.

The upstream MIT notice is retained in [SPEC-KIT-LICENSE.txt](SPEC-KIT-LICENSE.txt). This does not choose a distribution license for future combined application code. Source reuse requires the license/dependency review in migration.md, with each source's attribution preserved. No upstream project source was copied into the application tree during this task.
