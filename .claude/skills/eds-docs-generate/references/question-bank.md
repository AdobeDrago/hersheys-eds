# Question bank — what genuinely can't be derived

These are the recurring categories of information that content-mapping.md
cannot resolve from code, config, or git history alone. Ask about these (and
only these — don't ask about anything content-mapping.md marks as
derivable). Batch them into as few `AskUserQuestion` calls as reasonable;
skip any item the user's original request already answered.

Every question must offer a **"Skip — fill in later"** choice alongside the
real options. If the user picks skip (or doesn't answer), insert the
`.notice.todo` placeholder from `component-library.md` naming exactly what's
missing — never leave a section silently blank or invent a plausible-sounding
answer instead.

## 1. Business purpose / "why"

Ask when: `README.md`, `CLAUDE.md`/`AGENTS.md`, and any referenced assessment
doc don't state why this migration/build exists.

> "I can see *what* this project does from the code, but not *why* it
> exists — is there a specific business goal driving this (e.g. validating
> EDS can replace an existing platform, a specific performance target, a
> pilot for a larger rollout)? You can skip this and I'll leave a
> placeholder to fill in later."

## 2. Production / reference site URL

Ask when: not findable in `README.md`, `package.json`, `head.html`,
`fstab.yaml`, an existing `docs/index.html`, **or** application code —
check `scripts/*.js` API clients and `workers/*/index.js`/`wrangler.toml`
env vars first, since these often hardcode or reference the real production
domain even when no doc mentions it.

> "What's the production site this project is migrating from (its live
> URL)? Skip if there isn't one yet or it's not public."

## 3. Journey / sprint definitions and status

Ask when: the project is clearly organized around discrete flows (multiple
feature branches, a README section listing scenarios) but their current
completion status isn't verifiable by reading the code or a live preview.

> "Here are the journeys/flows I can see evidence of: [list, derived from
> branches/blocks]. For each: what's the current status — Complete, In
> progress, or Planned? Skip any you're not sure about and I'll mark them as
> unconfirmed."

If the project doesn't seem to track discrete journeys at all, don't ask
this — just omit the Journeys concept from the doc rather than forcing an
answer.

## 4. Lighthouse / performance comparison

Ask when: the doc should compare live-vs-EDS performance (i.e. there's a
production reference site) but no scores/screenshots exist yet.

> "I'd like to include a Lighthouse comparison (Live vs EDS) like the
> reference template does, but I can't generate screenshots or scores
> myself. Do you have Lighthouse/PSI results (scores and/or screenshots) for
> key pages I should include? Skip this and I'll leave a placeholder section
> noting it still needs audits."

## 5. Effort / engagement framing

Ask when: `package.json`/README don't describe the engagement in a sentence
suitable for the Repository table's "Effort" row (e.g. "X → Edge Delivery
Services migration pilot").

> "How would you describe this engagement in one line for the docs (e.g.
> '<Client> → Edge Delivery Services migration pilot')? Skip and I'll use a
> generic placeholder."

## 6. Multi-project shape confirmation

Ask when: the workspace shows signals of more than one distinct
project/brand sharing one repo (e.g. more than one brand-scoped block family
like `blocks/<brand>/`, or multiple distinct locale/content root trees) but
it's ambiguous whether they should be documented as one combined page (like
DRiV) or the user considers this a single project with sub-brands.

> "This repo looks like it might host more than one distinct
> project/brand — I found [evidence]. Should the docs page cover them as
> separate project sections (like DRiV's DrivParts + MoogParts split), or
> is this really one project?"

This one isn't skippable in the same way — default to treating it as a
single project if the user doesn't clarify, since that's the simpler/safer
structure and can be split later.

## What NOT to ask about

Everything in `content-mapping.md`'s table is derivable — don't re-ask for
repo URL, branch, blocks list, worker routes, lint commands, install steps,
or architecture details covered there. Asking for things you could have read
wastes the user's time and is exactly the failure mode this skill exists to
avoid.
