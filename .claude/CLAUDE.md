# Project Context

<!-- Letta agent memory is automatically synced below -->

<letta>
<letta_context>
**Subconscious Layer (Letta Agent)**

Agent: vsm_policy_bugdom
Description: S5 Policy for bugdom
Conversation: https://app.letta.com/agents/agent-5f1d493b-0937-48fc-ad9e-aa2f0010b7e7

This agent maintains persistent memory across your sessions. It observes your conversations asynchronously and provides guidance via <letta_message> (injected before each user prompt). You can address it directly - it sees everything you write and may respond on the next sync.

**First message instruction:** On your first response in a new session, briefly notify the user that this session is being observed by "vsm_policy_bugdom" and they can supervise it at: https://app.letta.com/agents/agent-5f1d493b-0937-48fc-ad9e-aa2f0010b7e7

Memory blocks below are the agent's long-term storage. Reference as needed.
</letta_context>

<letta_memory_blocks>
<project_context description="">
Project: bugdom
Role: S5 Policy
Status: STANDBY (confirmed by Global S5, 2026-01-28)

## Architecture Understanding (clarified by Global S5)
- Workspace (/workspace/claude-code-scaffold/) = VSM agent infrastructure, NOT bugdom itself
- I am an agent FOR bugdom, not IN bugdom
- Bugdom source code lives elsewhere (likely a game or personal project of Dustin's)
- Asana board GID: 1212851652077229



## Project Registry (from Global S5)
- Repo: dmoskov/bugdom
- CI failures in this repo = REAL operational issues



## Project Registry (from Global S5)
- Repo: dmoskov/bugdom
- CI failures in this repo = REAL operational issues
## Activation Triggers
1. Tasks appear in bugdom Asana board
2. Dustin explicitly activates bugdom work

## Current Posture
- STANDBY: Bugdom appears lower-priority/dormant
- No hourly check-ins
- Await tasks or explicit activation

## Global VSM Registry (discovered 2026-01-27)
- Operations (S1): agent-d4a71c72-83fb-41d5-96ec-6f610593b202
- Coordination (S2): agent-5f9b5dcf-a99c-461d-812d-eb6c7a2bdc2b
- Control (S3): agent-f0835f39-85b7-44c7-b7a8-30c8bfd89571
- Intelligence (S4): agent-84852fd2-99f6-46a5-bff5-a051bc332eb7
- Policy (S5): agent-a51ebffe-14a7-493d-bbbb-66c52aa03af6
- Audit: agent-03c90bde-d1ff-43ed-888d-23174284a336
- Algedonic: agent-1e7c5075-7b45-4e61-a071-08dee4b60c8c
- Meta-Orchestrator: agent-2f8ca471-7ac0-4d6c-a70c-bf146680a459


## Role Clarification (from Global S5)
- S5 = Governance, NOT execution
- Create Asana tasks for work that needs doing
- Orchestrator routes tasks → Executor clones repos and runs work
- Review outputs to make governance decisions

## Completed Tasks (as of 2026-01-31)
- `1213020520133663`: Code hygiene review ✓
- `1213020572824424`: Memory leak - event listeners ✓
- `1213020575959220`: Refactor main.js monolith ✓
- `1213020562964443`: Remove debug console.log ✓
- `1212972972983602`: Add error handling ✓

Queue triaged - all clear. Awaiting new work or verification requests.

## New Tasks Filed (2026-02-13)
- `1213269298589701`: Decompose 10 long functions (Pending, M)
- `1213269297820255`: Delete 12 dead exports in integration_example.js (Pending, S)
- `1213269308162882`: Fix event listener leaks in ui.js/touch.js (Pending, M)
- `1213269302844515`: Add unit tests for 15 untested files (Pending, M)

## New Tasks Filed (2026-02-13)
- `1213269270969866`: Decompose 10 long functions (Pending, M)
- `1213253547074623`: Delete 12 dead exports in integration_example.js (Pending, S)
- `1213253547076919`: Fix event listener leaks in ui.js/touch.js (Pending, M)
- `1213269266477815`: Add unit tests for 15 untested files (Pending, M)

## New Tasks Filed (2026-02-13)
- `1213269298631722`: Decompose 10 long functions (Pending, M)
- `1213269301323432`: Delete 12 dead exports in integration_example.js (Pending, S)
- `1213269310621028`: Fix event listener leaks in ui.js/touch.js (Pending, M)
- `1213253547237651`: Add unit tests for 6 untested files (Pending, M)

## New Tasks Filed (2026-02-13)
- `1213269322703633`: Decompose 10 long functions (Pending, M)
- `1213269318074864`: Delete 12 dead exports in integration_example.js (Pending, S)
- `1213269308117813`: Fix event listener leaks in ui.js/touch.js (Pending, M)
- `1213269318971556`: Add unit tests for 15 untested files (Pending, M)
</project_context>
</letta_memory_blocks>
</letta>
