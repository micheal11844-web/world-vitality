# World Vitality

Monorepo for the World Vitality platform. See `docs/` for the foundational documents (Constitution, Engineering Blueprint, PRD, Experience Blueprint), architectural decision records, and the execution checklist in `BUILD_PLAN.md`.

## Repo layout

| Folder      | Contents                                                                   |
| ----------- | -------------------------------------------------------------------------- |
| `apps/`     | Deployable, user-facing surfaces (web, mobile, admin)                      |
| `services/` | Independently deployable backend services                                  |
| `packages/` | Shared code with no independent deployment lifecycle                       |
| `infra/`    | Infrastructure as code                                                     |
| `docs/`     | Source of truth: constitution, blueprints, ADRs, runbooks, data provenance |
| `tools/`    | Internal developer productivity tooling                                    |
| `tests/`    | Cross-cutting, cross-application test suites (e2e)                         |

Each folder above has its own `README.md` with folder-specific rationale.

## Status

Repository is at BUILD_PLAN.md Stage 0 (repository foundation). See `BUILD_PLAN.md` for the full staged execution plan and current checklist state.
