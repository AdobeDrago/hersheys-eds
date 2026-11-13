---
name: eds-docs-generate
description: >
  Generates or updates docs/index.html — the standard project documentation page
  for Adobe Drago EDS (Edge Delivery Services) projects — by analyzing the current
  workspace (project structure, blocks, scripts, config, workers, existing docs, and
  git history) and producing project-specific documentation that follows the
  established Adobe Drago template (inline CSS design system, sidebar nav, doc
  sections, notices, tables, journey/progress tracking, Lighthouse comparisons).
  Trigger whenever the user asks to generate, create, update, refresh, or regenerate
  project docs / docs/index.html / the documentation site for an EDS project, or asks
  to "document this project" for an Adobe/EDS repo. Works whether docs/index.html
  already exists (update mode — refresh what changed, preserve what's still valid) or
  doesn't exist yet (generate mode — build from the standard template). Asks the user
  only for information that genuinely can't be derived from the workspace (business
  rationale, journey/sprint status, Lighthouse scores/screenshots, production URL if
  undocumented), always offering to skip and fill in later, and marks any skipped
  item with a clearly visible placeholder in the generated HTML so it's easy to find
  and complete afterward.
---

# Generate/update Adobe Drago EDS project docs

Produce `docs/index.html` for an Adobe Edge Delivery Services (EDS) project,
following the standard Adobe Drago documentation template: a single
self-contained HTML file (inline CSS, no build step, one small scrollspy
script) with a fixed top nav, sticky sidebar, and content sections describing
the project's overview, architecture, blocks, integrations, and progress.

The template's full CSS/JS and content skeleton live in
`assets/docs-template.html` — copy it, don't recreate it from memory. The
component vocabulary (every reusable class, with an example) is in
`references/component-library.md`. Where to find the evidence for each
section is in `references/content-mapping.md`. The standard set of questions
to ask when evidence doesn't exist is in `references/question-bank.md`.

**Guiding rule, same as the reference implementation (DRiV's own
`docs/index.html`, hand-edited in lockstep with real feature work across many
commits): every claim in the doc should trace back to something actually
read in the workspace, or something the user explicitly told you. Never
invent business narrative, journey status, or performance numbers — ask, or
mark it as a placeholder.**

## Step 0 — Detect mode and shape

1. Resolve the target repo: the current working directory if it looks like
   an EDS project (`blocks/` + `scripts/` present), otherwise ask which repo
   path to use.
2. Check for `<repo>/docs/index.html`:
   - **Present → update mode.** Read the whole file before changing
     anything. You'll refresh sections whose backing facts have visibly
     changed and preserve hand-authored content (narrative prose, Lighthouse
     scores, journey status) that current evidence doesn't contradict —
     never do a wholesale rewrite of an existing doc.
   - **Absent → generate mode.** Copy `assets/docs-template.html` to
     `<repo>/docs/index.html` as the starting point.
3. Detect single- vs multi-project shape: look for signals of more than one
   distinct brand/project sharing the repo (e.g. more than one
   brand-scoped block family like `blocks/<brand>/`, multiple distinct
   locale/content root trees, or the user's request naming more than one
   product). Default to **single-project** unless this is clearly the case —
   if ambiguous, ask (question-bank.md §6). If multi-project, follow the
   pattern documented in the trailing HTML comment of
   `assets/docs-template.html` (duplicate the project-divider + section set
   per project, prefix anchors, share genuinely-shared sections via
   cross-links rather than duplication).

## Step 1 — Analyze the workspace (no questions yet)

Read `references/content-mapping.md` and work through its evidence list:
structure scan, `scripts/aem.js`/`scripts/scripts.js` diffed against stock
`aem-boilerplate`, `blocks/*`, `workers/*` (routes + wrangler config),
`package.json` scripts, config files (`fstab.yaml`/`paths.json`/
`helix-query.yaml`/`.env.example`), existing docs (`README.md`,
`CLAUDE.md`/`AGENTS.md`), `git remote -v` + `git log --oneline --stat -50` +
branch names, and `docs/images/*` if present. This step is purely reading —
don't ask the user anything yet, and don't start writing the doc yet either.

## Step 2 — Derive everything reliably inferable

Using what Step 1 surfaced, write the sections that are backed by direct
evidence: Repository info, Install & run, Linting & CI, Block-loading
routing, Page decoration, EDS blocks table, Supporting modules, Workers,
Deploying, Key references (preview/DA URLs). Cite the real file/module
behind each claim as you go (in your own working notes, not necessarily in
the HTML) so you can sanity-check nothing here is guessed.

Do **not** yet write: business purpose narrative, journey/sprint status,
Lighthouse scores/screenshots, or anything else `question-bank.md` flags as
non-derivable. Leave those sections pending until Step 3.

## Step 3 — Ask for what's missing

Work through `references/question-bank.md`. Use `AskUserQuestion` (plain
text fallback if unavailable), batched into as few calls as reasonable, and
skip anything the user's original request already answered. Every question
includes a "Skip — fill in later" option.

## Step 4 — Write `docs/index.html`

- **Generate mode**: fill the copied template's `{{PLACEHOLDER}}` tokens and
  `<!-- FILL:... -->` guidance with the derived + user-provided content, then
  remove the authoring comments (they're for you, not the reader). Delete
  any optional section the project doesn't have evidence for (proxy,
  workers, Lighthouse comparison, journeys) rather than leaving it half-filled.
- **Update mode**: make targeted edits to the existing sections whose
  backing facts changed; add new sections for new blocks/workers/journeys
  discovered; leave everything else as-is.
- **Anything skipped in Step 3**: insert the `.notice.todo` placeholder
  (see `component-library.md`) naming exactly what's missing and where it
  should go — never a silent gap, never a fabricated value.
- Compose all content using the classes catalogued in
  `component-library.md` — don't add new CSS or restructure the topnav/
  sidebar/main layout.
- If new screenshots were provided for a Lighthouse comparison, save them
  under `docs/images/` alongside any existing ones (don't discard existing
  screenshots that are still valid).

## Step 5 — Summarize

Tell the user, concisely: what was derived directly from the workspace, what
they were asked and answered, what was left as a `.notice.todo` placeholder
(and exactly what's needed to complete it), and confirm the path written
(`<repo>/docs/index.html`).

## Edge cases

- **Empty/near-empty EDS project** (freshly scaffolded from
  `aem-boilerplate`, no custom blocks/workers yet): most sections will be
  short and say so plainly ("no custom block routing — stock
  `aem-boilerplate` behavior") rather than being padded out. This is a
  correct, honest doc, not an incomplete one.
- **No git history** (shallow clone, or repo just initialized): fall back to
  reading the working tree only; note in your Step 5 summary that
  history-derived context (e.g. active feature branches) wasn't available.
- **Existing `docs/index.html` that doesn't follow this template** (a
  different one-off doc page): treat as update mode but confirm with the
  user whether to migrate it to this template's structure/styling or only
  refresh its content in its current form — don't silently replace a
  differently-structured page without saying so.
- **Large block count**: group trivially similar blocks into one table row
  (see content-mapping.md) rather than padding the EDS blocks table.
