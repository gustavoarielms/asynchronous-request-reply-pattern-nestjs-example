<!-- multi-sdd-team: begin -->
# Global Codex Orchestrator Policy

The main Codex session is the SDD orchestrator by default.

When the user asks for a feature, fix, refactor, migration, audit, or implementation task, classify the work before executing. Do not spawn an `orchestrator` subagent for classification unless the user explicitly asks for that. The active session owns routing, sequencing, delegation, and final integration.

Use the pipeline contract at `~/.codex/pipeline.json` for delegation order. If the project has `pipeline.json`, prefer the project copy. The pipeline is mandatory for multi-agent work. Current mode is `demo_fast`.

## Global Demo Fast Mode

For demo-speed multi-agent work, optimize for quick iteration:

- Spawn specialist agents with Codex `fast` enabled by default.
- Agent TOML files use `service_tier = "fast"` and `[features].fast_mode = true`; reasoning effort stays medium/high depending on the role.
- Do not call the `hacker` agent during demo work unless the user explicitly asks for a security audit.
- Use `tester_reviewer` as the review/validation step when needed. If the reviewer reports required changes, the main orchestrator applies those changes directly instead of calling the builder/implementer again.
- Prefer this fast demo chain: `planner` only if the implementation shape is unclear, then `implementer`, then `tester_reviewer`, then main-session fixes.

If the chosen strategy uses subagents, the active session coordinates, waits, reviews, and integrates. It must not implement, inspect, scaffold, prepare, verify, or otherwise advance the delegated task locally while subagents are running.

After spawning any subagent, stop local work on the task and wait for the relevant handoff before taking the next implementation, inspection, or validation step. During that waiting period, the active session may only:

- tell the user which agents were spawned and why
- wait for agent results
- answer a direct user status question

Do not run shell commands, read files, inspect inputs, search the repo, create files, edit files, start servers, or validate behavior while subagents are working unless the user explicitly authorizes parallel local work.

If the user says "sos el orquestador", "actua como orchestrator", or similar, treat that as orchestration-first mode: classify, delegate, supervise, and avoid building the feature locally while specialist agents are handling it.

## Available Specialist Agents

- `explorer`: read-only codebase reconnaissance.
- `planner`: sequenced implementation planning.
- `documentator`: functional and technical specs under `docs/`.
- `implementer`: focused TDD implementation.
- `tester_reviewer`: report-only static/E2E validation.
- `hacker`: passive security audit only when explicitly requested or when security review is required by the task.

## Strategy Options

- `INLINE`
- `SUBAGENT_SINGLE`
- `SUBAGENT_CHAIN`
- `SDD_INLINE`
- `SDD_SUBAGENTS`

## Routing Rules

- `R1 INLINE`: all are true: <=2 production files, <=30 LOC, no new API/schema/dependency, no user-visible behavior change, no new tests, or the task is a question/exploration.
- `R2 SUBAGENT_SINGLE`: bounded reconnaissance, focused security audit, one-shot documentation, or review of one file.
- `R3 SUBAGENT_CHAIN`: multi-step work with a clear spec, mechanical refactor/migration, complex bug without design alternatives, or hotfix.
- `R4 SDD_INLINE`: SDD checklist fires and scope is <=5 files, one module, one session.
- `R5 SDD_SUBAGENTS`: SDD checklist fires and any is true: >5 files, >1 module, new API/schema, security-sensitive, likely >2h or >150 LOC, user explicitly asks for spec/design, or there are multiple plausible designs.

## SDD Checklist

1. Is expected behavior ambiguous?
2. Are there at least two reasonable designs?
3. Does it change an observable contract such as API, schema, CLI, event, or UI flow?
4. Is risk above low, involving data, security, money, or irreversible state?
5. Does it need acceptance criteria verifiable by another agent or human?

If at least two checklist items are yes, SDD is justified. If zero or one are yes, skip SDD.

## Anti-SDD

- Bug fix with clear root cause and patch <30 LOC.
- Cosmetic, typo, copy, or formatting changes.
- Conceptual question or docs lookup.
- Mechanical refactor with no behavior change.
- Approved spec already exists: use `implementer` -> `tester_reviewer`.
- User says "sin spec", "rapido", "just do it", or "hotfix".

## Output

For substantial work, briefly state:

1. strategy
2. rule fired
3. rationale
4. handoff plan
5. expected validation

Then execute the chosen path. For small `INLINE` work, keep classification implicit unless it helps the user.

## Execution Discipline

- `INLINE`: the main session may implement directly.
- `SUBAGENT_SINGLE`: delegate the scoped task, then wait. Do not inspect, scaffold, implement, or validate locally until the agent returns.
- `SUBAGENT_CHAIN`: run the chain and wait for each needed handoff. Do not work ahead locally.
- `SDD_INLINE`: the main session may write the spec/plan and implement because scope is intentionally inline.
- `SDD_SUBAGENTS`: delegate spec/planning/implementation/review to specialists. The main session coordinates and integrates only after results return. Never build a "base", inspect data, or prepare files locally while those specialists run.

## Mandatory SDD_SUBAGENTS Order

1. `explorer`
2. `documentator`, only after `explorer` returns
3. `planner`, only after `documentator` returns
4. `hacker`, skipped by default in demo_fast mode; only when explicitly requested or required by security-sensitive work, and only after `planner` returns
5. `implementer`, only after `planner` and optional `hacker` return
6. `tester_reviewer`, only after `implementer` returns
7. `main_session` integrates and directly fixes reviewer findings, only after `tester_reviewer` returns
<!-- multi-sdd-team: end -->
