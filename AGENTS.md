AGENTS
======

Quick rules for automated agents and contributors working in this repository:

- Always read `LLM-UNIFIED-GUIDE.md` before making changes. That guide contains project conventions, expectations for patches and PRs, and workflow notes that must be followed.
- When opening a PR for a non-trivial change, create a small focused branch and include build/lint results in the PR description.
- Follow the repository conventions in `LLM-UNIFIED-GUIDE.md` for naming (`dto` vs `dtos`), folder layout, and commit message style.
- Do not modify production logic in bulk; prefer small, reviewable commits and include tests or lint fixes when applicable.

If you are an automated tool: read `LLM-UNIFIED-GUIDE.md` at the repository root before applying or proposing any edits.
