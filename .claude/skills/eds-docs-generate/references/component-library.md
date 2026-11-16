# Component library — Adobe Drago EDS docs template

Every reusable class in `assets/docs-template.html`, with a minimal example.
Compose new content with these — don't invent new CSS or restructure the
layout. All examples assume the template's `<style>` block is present
unchanged.

## Layout shell

- `.topnav` / `.topnav-logo` / `.topnav-divider` / `.topnav-title` /
  `.topnav-badge` — fixed 56px top bar. One per document.
- `.layout` → `.sidebar` (sticky nav) + `.main` → `.main-inner` (max-width
  860px content column). One per document.
- `.sidebar-section` / `.sidebar-label` / `.sidebar-link` (with `.icon` SVG)
  — grouped nav links. `.sidebar-link.active` is toggled by the scrollspy
  script at runtime; don't hardcode `active` in generated markup.

## Page-level intro

```html
<div class="page-hero" id="overview">
  <div class="page-hero-eyebrow">Project · Pilot</div>
  <h1>Project EDS Pilot</h1>
  <p class="page-hero-sub">One or two sentences of scope/summary.</p>
</div>
```

Use once for the site-wide intro (`#site-intro`) and once per project's own
intro. Not a repeatable per-section component.

## Section (the main content unit)

```html
<section class="doc-section" id="some-anchor">
  <h2>
    <span class="section-icon icon-blue">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">...</svg>
    </span>
    Section title
  </h2>
  <div class="section-rule"></div>
  <p>Body content...</p>
</section>
```

Icon color variants (pick one that reads well against the content, no fixed
mapping — DRiV used `icon-blue` for references, `icon-navy` for
install/linting/page-decoration, `icon-green` for blocks/lighthouse/journeys,
`icon-purple` for page-decoration, `icon-seafoam` for proxy/workers,
`icon-orange` for supporting-modules — reuse that assignment unless a
section's content suggests a better fit): `.icon-blue`, `.icon-navy`,
`.icon-green`, `.icon-purple`, `.icon-seafoam`, `.icon-orange`.

Every `.doc-section` needs a unique `id` matching its sidebar link's `href`.

## Requirements / bullet lists

```html
<ul class="req-list"><li>One requirement per line.</li></ul>
```

## Numbered setup steps

```html
<ol class="steps">
  <li class="step">
    <div class="step-num"></div>
    <div class="step-body">
      <div class="step-title">Step title</div>
      <div class="code-block">shell commands here</div>
      <p>Optional explanation.</p>
    </div>
  </li>
</ol>
```

`.step-num` is auto-numbered by CSS `counter()` — leave it empty, don't put
"1", "2" text inside it.

## Code

- `.code-block` — dark block, `white-space: pre` (preserve exact line
  breaks/indentation). Optional inline syntax spans: `.kw` (keyword), `.var`
  (variable), `.str` (string), `.cmt` (comment) — only add these if
  reproducing an actual code excerpt; plain shell commands don't need them.
- `.code-inline` — inline `<code>` chip for filenames, identifiers, paths.

## Callouts

```html
<div class="notice info"><svg class="notice-icon" ...></svg><span>...</span></div>
<div class="notice tip"><svg class="notice-icon" ...></svg><span>...</span></div>
<div class="notice warning"><svg class="notice-icon" ...></svg><span>...</span></div>
```

- `.info` — neutral clarification (e.g. "pages under X behave like Y").
- `.tip` — a helpful pointer or alternate path.
- `.warning` — something that's stale, inconsistent, or needs attention
  (mismatched config, a preview URL that isn't production, etc.) — this is
  for real, evidenced issues, not missing information.
- `.todo` (new — not in the original DRiV page) — **use this one, and only
  this one, for content the user explicitly skipped**:

```html
<div class="notice todo">
  <svg class="notice-icon" width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-.25A.75.75 0 017.25 7h1a.75.75 0 01.75.75v2.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25v-2h-.25a.75.75 0 01-.75-.75zM8 6a1 1 0 100-2 1 1 0 000 2z"/></svg>
  <span><strong>Placeholder</strong> — Lighthouse scores and screenshots for the Parts Finder journey weren't provided. Add them to <code class="code-inline">docs/images/</code> and update this section.</span>
</div>
```

Say exactly what's missing and what to do about it — never a bare "TODO".

## Tables

```html
<table class="spec-table">
  <thead><tr><th>Col</th><th>Col</th></tr></thead>
  <tbody><tr><td>...</td><td>...</td></tr></tbody>
</table>
```

`.blocks-matrix` variant (adds centered ✓/✗ columns) is only worth using when
one doc page genuinely compares block usage across more than one project —
for a single-project doc, use the plain `.spec-table` with a "Purpose" column
instead of a matrix nobody's comparing against.

```html
<span class="mark-yes">✓</span> / <span class="mark-no">✗</span>
```

## Journey / progress checklist

```html
<ul class="checklist">
  <li class="check-item">
    <span class="check-mark cm-done"><svg viewBox="0 0 16 16" fill="currentColor">...</svg></span>
    <div class="check-body">
      <div class="check-title">Item title</div>
      <div class="check-note">Detail.</div>
    </div>
  </li>
</ul>
```

`.cm-done` (green check), `.cm-partial` (amber), `.cm-todo` (gray, not
started) — these three states describe *implementation* status and should
reflect what's actually true of the code, confirmed with the user when it
can't be verified by reading the code/live preview alone.

## Status badges

- `.status-badge` (pill, used inline in a section `<h2>`): `.sb-done`,
  `.sb-progress`, `.sb-warn`, `.sb-planned`.
- `.nav-status` (smaller pill, used in tables/sidebar labels): `.ns-done`,
  `.ns-progress`, `.ns-gap`, `.ns-planned`.

## Link cards

```html
<div class="url-grid">
  <a class="url-card" href="..." target="_blank" rel="noopener">
    <span class="url-card-label"><span class="dot dot-blue"></span>Preview</span>
    <span class="url-card-title">Short title</span>
    <span class="url-card-url">https://...</span>
    <span class="url-card-desc">Optional one-line description.</span>
  </a>
</div>
```

Dot colors: `.dot-blue`, `.dot-navy`, `.dot-green`, `.dot-orange`.

## Lighthouse comparison

```html
<div class="lh-compare">
  <div class="lh-compare-page">
    <div class="lh-compare-page-title">Homepage <span>/ · /path/on/eds</span></div>
    <div class="lh-compare-cols">
      <div class="lh-compare-side">
        <div class="lh-compare-side-header">
          <span class="lh-compare-label">Live</span>
          <div class="lh-scores"><span class="lh-score lh-score-ok">Perf 64</span></div>
        </div>
        <img src="images/live-homepage.png" alt="...">
      </div>
      <div class="lh-compare-side">
        <div class="lh-compare-side-header">
          <span class="lh-compare-label">EDS</span>
          <div class="lh-scores"><span class="lh-score lh-score-good">Perf 100</span></div>
        </div>
        <img src="images/eds-homepage.png" alt="...">
      </div>
    </div>
  </div>
</div>
```

Score color by value, not by side: `.lh-score-good` (~90+), `.lh-score-ok`
(~50–89), `.lh-score-bad` (<50). Never fabricate a score — if it wasn't
supplied, use a `.notice.todo` instead of a guessed number.

## Multi-project divider

```html
<div class="project-divider" id="project-slug">
  <div class="project-divider-eyebrow">Project</div>
  <h2>Project Name</h2>
  <p>One-paragraph scope description.</p>
</div>
```

Only used when one doc page documents more than one project (see
`assets/docs-template.html`'s trailing comment and `SKILL.md` Step 0).

## Footer

```html
<div class="doc-footer"><span>Project — AEM → Edge Delivery Services · docs/</span></div>
```

One per document, at the very end of `.main-inner`.
