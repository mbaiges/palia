# Medice repository guidance

## Repository layout

- `front/` contains the existing React + Vite application.
- `api/` contains the Node.js API scaffold and its backend-specific `AGENTS.md`.
- Root-level documents under `docs/` describe behavior and architecture shared by both applications.
- Keep each app's dependencies, configuration, and tests in that app's directory. Root scripts may orchestrate them.

## Product and technical specifications

For cross-application features or substantial behavior changes, use the local Open Agent Skills before implementation:

1. Read `.agentic/open-agent-skills/skills/functional-spec/SKILL.md` and its referenced guardrails. Write product behavior to `docs/features/<feature>/functional-spec.md` and get unresolved product decisions from the user.
2. For engineering design, read `.agentic/open-agent-skills/skills/technical-spec/SKILL.md`. Start from the functional spec, map every acceptance criterion, and ask about unresolved infrastructure and API decisions.

The skill checkout under `.agentic/open-agent-skills/` is local tooling and is intentionally Git-ignored. Its contents can be restored from the sibling `../matices/.agentic/open-agent-skills/` repository.

Do not implement a non-trivial feature until its product and technical decisions are agreed with the user.
