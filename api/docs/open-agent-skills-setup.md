# open-agent-skills (local setup)

This repository uses the open-agent-skills marketplace through the local clone under `.agentic/` (gitignored). Cursor loads the skills through `.cursor/rules/agentic-skills.mdc`.

The local skills directory is exposed through `.agents/skills`. The active bundle is:

`functional-spec → technical-spec → loop-build`

The `.agentic/` directory is intentionally ignored and must not contain secrets or application state.
