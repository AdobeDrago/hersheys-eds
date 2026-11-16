# Content mapping — where to find evidence for each doc section

For each section of `assets/docs-template.html`, read exactly this evidence
before writing it. Don't skip straight to writing prose from general EDS
knowledge — every claim should trace back to something actually read in this
step.

| Doc section | Evidence to read | Notes |
|---|---|---|
| Overview → Purpose | `README.md` intro, `CLAUDE.md`/`AGENTS.md`, any `*-assessment.md` or `*-requirements.md` referenced from those, git log messages on the earliest commits/branches | If the "why" isn't stated anywhere, don't infer it from block names alone — ask (question-bank.md). |
| Overview → Core engineering requirements | `scripts/aem.js`, `scripts/scripts.js`, `blocks/` folder names, any custom `scripts/*.js` modules, `package.json` dependencies | State requirements as observed constraints ("uses X because Y exists in the code"), not aspirational goals. |
| Overview → Journeys table | Primary: distinct block-driven flows — group the EDS blocks table by what chain of blocks/routes/worker paths they form together (e.g. a search block → a results block → a details block is one journey), cross-referenced against `workers/*` route tables. Secondary: README sections or sprint-named branches, if any name a flow explicitly. **Status** (Complete/In progress/Planned) is not reliably derivable — confirm with the user | Real projects' branch names are often generic (`bugfix/*`, `chore/*`, person-named `feature/*`) and won't name a flow — don't rely on branch names as the primary signal. If journeys aren't a concept this project uses (no such block groupings, no README section), omit the whole Journeys concept — don't force-fit it. |
| Overview → Repository table | `git remote -v` (org/repo), `git branch --show-current` or default branch, `package.json` (`name`, base template hints), `blocks/` presence of stock names to infer `aem-boilerplate` lineage, `workers/`/integration folders for "Backend services", `.github/workflows/*.yaml` + test config for "Testing" | All of this is reliably derivable — don't ask the user for it. |
| Key references (url-cards) | `git remote -v` → GitHub URL; preview URL pattern `https://{branch}--{repo}--{org}.aem.page/`; production/reference site URL from README/package.json/`head.html`/existing docs **and also** from application code — `scripts/*.js` API clients and `workers/*/index.js`/`wrangler.toml` env vars often hardcode or reference the real production/reference domain even when no doc mentions it; DA.live source from `fstab.yaml` mountpoints if present, else org/repo convention | Don't just take `git branch --show-current` as the deployed branch — cross-check it against any `EDS_ORIGIN`/upstream origin constants in `workers/*/index.js` or `wrangler.toml`. If the checked-out branch and the branch actually referenced by a deployed worker disagree, that's a real, evidenced inconsistency worth a `.notice.warning` (see component-library.md), not something to silently pick one of. |
| Install & run | `package.json` `scripts` block, README install steps, `.nvmrc`/engines field | Reproduce actual commands verbatim; don't paraphrase into generic "npm install" instructions if the real steps differ. |
| Linting & CI | `package.json` `lint*` scripts, `.eslintrc*`, `.stylelintrc*`, `.github/workflows/*.yaml` | State plainly what CI does *and does not* run (build/deploy/test) if that's the case — DRiV's own doc explicitly calls out "lint only, no build/deploy/test," which is exactly the kind of honest gap worth keeping. |
| Local proxy / backend bridge | `tools/*.mjs` or `.js` proxy scripts, their env vars, what paths they route | Only include this section if such a script actually exists. Don't invent a proxy section for a project with no backend integration. |
| Architecture → Block-loading routing | Diff `scripts/aem.js` against a fresh `aem-boilerplate` checkout (or against `@adobe/helix-project-boilerplate` upstream) to isolate real deviations in block resolution | If there's no deviation, say so briefly rather than padding the section — see eds-codebase-review's "Custom ≠ wrong" principle, which applies here too: only document actual drift. |
| Architecture → Page decoration | `scripts/scripts.js` top to bottom; `scripts/delayed.js` if present | One table row per distinct behavior/function, each tied to its trigger condition. |
| Architecture → EDS blocks | `blocks/*/` — read each block's `.js` (decorate export) and skim its `.css`; infer purpose from what it fetches/renders, not just the folder name | For large block counts, group trivially similar blocks (e.g. `cards`, `cards-category`, `cards-article`) into one row if their purpose is genuinely shared. |
| Architecture → Supporting modules | `scripts/*.js` beyond `aem.js`/`scripts.js`/`delayed.js` | List exports and who imports them (`grep -rn "from '.*<module>\.js'" blocks scripts` — include the `.js` in the pattern, since real import specifiers are `from './module-name.js'` and a pattern missing the extension matches nothing). If a module has no static importer anywhere in the repo, it may be loaded by an external convention (e.g. a DA.live authoring/UE reference, a script tag injected by another tool) — say so plainly as unconfirmed rather than guessing who uses it. |
| Lighthouse comparison | Not derivable from code at all — screenshots and scores must come from the user, or be left as a `.notice.todo` | Never fabricate scores. If `docs/images/*.png` already exist (update mode), reuse them; don't discard existing screenshots without being told they're stale. |
| Journey progress sections | Blocks actually wired into that flow (cross-reference the EDS blocks table), any URLs found in README/config for that flow; **status/checklist state** confirmed with the user | Flow table (step → path → what happens) is derivable by tracing the actual block/route chain; the "is this done" judgment is not. |
| Workers | `workers/<name>/index.js` (route table, request handling), `workers/<name>/wrangler.toml` (vars, compatibility date, routes) — name env vars, never print secret values even if visible in a local `.dev.vars` | One `.doc-section` per worker. |
| Deploying | `package.json` `deploy:*` scripts | Reproduce verbatim. |
| Update mode — existing `docs/index.html` | Read the whole existing file before changing anything | Preserve hand-authored prose, scores, and journey narrative that current code evidence doesn't contradict; only replace sections whose backing facts have visibly changed (new blocks, renamed workers, new config) — this mirrors the DRiV commit history pattern where the doc was edited in lockstep with real changes, never wholesale-regenerated. |

## Structure scan (run first, every time)

```bash
ls <repo>; ls <repo>/blocks <repo>/scripts <repo>/styles <repo>/tools <repo>/workers 2>/dev/null
find <repo> -maxdepth 1 -iname "fstab.yaml" -o -iname "paths.json" -o -iname "helix-query.yaml" -o -iname ".env.example"
git -C <repo> remote -v
git -C <repo> branch --show-current
git -C <repo> log --oneline --stat -50
```

## Diffing against stock `aem-boilerplate`

To isolate real customizations in `scripts/aem.js` / `scripts/scripts.js`,
compare against the current `aem-boilerplate` reference (clone or fetch it to
a scratch path) rather than relying on memory of what "stock" looks like —
boilerplate helpers change over time.
