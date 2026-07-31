# Branching Strategy — Shanghai Travels / TravelOS

**Repository:** https://github.com/digiwebdex/shanghaitravels  
**Baseline tag:** `v1.0-phase-a` (Phase A production RC)  
**Rule:** Do **not** develop features directly on `main`.

---

## Branch model (overview)

```text
main  (production-ready only)
│
├── feature/phase-b-ticketing      ← current
├── feature/phase-b-hotel
├── feature/phase-b-transport
├── feature/phase-b-tour
├── feature/phase-b-hajj-umrah
├── feature/phase-c-finance
├── feature/phase-d-crm
├── feature/phase-e-agent-portal
├── feature/phase-f-customer-portal
└── feature/phase-g-ai

Optional long-lived:
  develop     — integration branch (use if parallel features need frequent merge)
  release/*   — harden a cut before tagging
  hotfix/*    — emergency fixes from a production tag
```

---

## Branch types

### `main` — production-ready releases

- Always deployable.
- Updated only via **merged PRs** (or fast-forward from a finished `release/*`).
- Protected: no direct feature commits.
- Annotated **tags** mark releases (`v1.0-phase-a`, later `v1.1-…`, `v2.0-…`).
- After merge to `main`, deploy `/erp/` (and related) from that commit.

### `develop` (optional)

- Use if several Phase B features land in parallel and need daily integration.
- For this repo’s current pace, **branching features from `main` and opening PRs into `main`** is enough.
- If `develop` is introduced later: features merge → `develop`; releases cut from `develop` → `main`.

### `feature/*` — product work

- One vertical / milestone per branch (see roadmap names above).
- Branch from latest `main` (or from `develop` if that model is adopted).
- Naming: `feature/<phase>-<module>` (kebab-case).
- Keep PRs focused; prefer small merges over mega-branches.
- Delete the remote branch after merge.

### `hotfix/*` — production emergencies

- Branch from the **deployed tag** (e.g. `v1.0-phase-a`) or from `main` if tip == production.
- Naming: `hotfix/short-description` or `hotfix/issue-123`.
- Merge back to `main` **and** into any active long-lived branch (`develop` / open `release/*`) so the fix is not lost.
- Tag a patch release after deploy (`v1.0.1-…`).

### `release/*` — release hardening

- Optional when a phase needs freeze + QA before tagging.
- Branch from `main` (or `develop`) when feature-complete: e.g. `release/phase-b`.
- Only bugfixes, version notes, and deploy chore — **no new features**.
- Merge to `main`, tag, then merge back to `develop` if used.

---

## Recommended workflow (this repository)

**Default: GitHub Flow + release tags** (simple, fits a small team and a live site).

1. **Start work**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/phase-b-ticketing
   ```

2. **Implement on the feature branch only**  
   Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`). Reference issues with `#n` when applicable.

3. **Push & open a PR into `main`**
   ```bash
   git push -u origin feature/phase-b-ticketing
   # Open PR: feature/phase-b-ticketing → main
   ```
   PR checklist: typecheck/lint/build, relevant smoke/e2e, no secrets, `visa-admin` not broken unless intentional.

4. **Merge** (squash or merge commit — prefer **squash** for noisy feature history; use merge commit if you want full history).

5. **Release**
   - Deploy from `main`.
   - When a phase is production-stable, create an annotated tag:
     ```bash
     git checkout main && git pull
     git tag -a v1.1-phase-b-ticketing -m "Phase B ticketing live."
     git push origin v1.1-phase-b-ticketing
     ```

6. **Hotfix**
   ```bash
   git checkout -b hotfix/critical-auth v1.0-phase-a   # or from main
   # fix → PR to main → deploy → tag v1.0.1 → merge fix into open feature branches as needed
   ```

---

## Phase roadmap branches (planned)

| Branch | Intent |
|---|---|
| `feature/phase-b-ticketing` | Air ticketing vertical (manual, no GDS) |
| `feature/phase-b-hotel` | Hotels |
| `feature/phase-b-transport` | Transport |
| `feature/phase-b-tour` | Tours |
| `feature/phase-b-hajj-umrah` | Hajj / Umrah |
| `feature/phase-c-finance` | Finance module UI |
| `feature/phase-d-crm` | CRM / leads |
| `feature/phase-e-agent-portal` | Agent portal |
| `feature/phase-f-customer-portal` | Customer portal |
| `feature/phase-g-ai` | AI / OCR expansion |

Create each from **updated `main`** when that phase starts — do not stack all Phase B modules on one long-lived branch unless intentionally sequencing merges.

---

## Protection recommendations (GitHub)

On `main`:

- Require pull request before merge  
- Require at least one review (when a second person is available)  
- Dismiss stale reviews on new commits  
- Restrict force-push and deletion  
- Optionally require status checks (`typecheck`, `lint`, `test:unit`) once CI is wired  

---

## Do / Don’t

| Do | Don’t |
|---|---|
| Branch from latest `main` | Commit features on `main` |
| Keep `main` green and deployable | Force-push `main` or rewrite tagged history |
| Tag stable production cuts | Put secrets (`.env`) in any branch |
| Merge hotfixes into open features | Leave hotfixes only on a side branch |

---

## Current session state (at doc creation)

| Check | Value |
|---|---|
| Current branch | `feature/phase-b-ticketing` |
| Branched from | `main` @ `b90f911` |
| Tag `v1.0-phase-a` | Present → `5a7a6e1` |
| `main` | Unchanged; no feature commits on `main` |
