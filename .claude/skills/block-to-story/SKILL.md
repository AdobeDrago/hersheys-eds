---
name: block-to-story
description: Create or update Storybook stories for blocks in blocks/. Use when a block is new, a block gained a variant or option, or the user says "add this block/variant to storybook". Pass block names, or no args to audit every block for missing stories AND missing variants.
---

# block-to-story

Turn blocks in `blocks/<name>/` into stories in `storybook/markup/` that render the production decorator and CSS with author-shaped markup. Covers new blocks **and new variants of blocks that already have stories**.

## 1. Audit: find what is missing (do this even with no args)
A block having a story file does NOT mean it is covered. Check both levels.

**a) Blocks with no story:** no file under `storybook/markup/` contains `blocks/<name>/`.

**b) Variants with no story** for every block (this is where new work usually hides):
1. Collect the block's variants from all of:
   - `classList.contains('x')` / `.matches(...)` / variant arrays (e.g. `BRAND_VARIANTS`) in `blocks/<name>/*.js`
   - variant files: `<name>-<variant>.js|css` in the block folder
   - CSS selectors: `grep -o "\.<name>\.[a-z][a-z-]*" blocks/<name>/*.css | sort -u`
   - README "Supported variations" tables and `metadata.json`
   - `git log --since=<date of last story change> -- blocks/<name>` for variants added recently
2. A variant is covered if a story passes it in the block's class string (`'<name> <variant> block'`, `classes: '...'`) or has an export named for it. Grep `storybook/markup/` for the variant word.
3. Also check **options** the block code reads that stories never exercise (e.g. a `right` flag, a badge paragraph, key/value rows).

Print a table: block → variants found → covered / missing. Add everything missing unless the user named a subset.

Skip with a one-line note: `fragment` (loader), `instagram` (external Elfsight script). `header`/`footer` are in `page-structure.stories.js` but still audit their variants (`hershey-nav`, `hershey-footer`).

## 2. Read the block before writing
- `blocks/<name>/<name>.js` header comment and code: content model (rows, cells, queried elements), variants, side effects (section classes, `document.body` classes, appended elements, localStorage, timers, fetches).
- `blocks/<name>/README.md` authoring table; all `blocks/<name>/*.css` (import every variant stylesheet).
- Real markup when unclear: `curl localhost:3000/<path>.plain.html` (needs `npx -y @adobe/aem-cli up`). Never edit `scripts/aem.js` or the block.

## 3. Write the story
Extend the block's existing stories file when it has one (add exports); create `storybook/markup/<name>.stories.js` only for new blocks. Follow `tabs`, `banner`, `link-group`, `poll` and `story-helpers.js`:
- Imports: `@adobe/aem-boilerplate/blocks/<name>/<file>` (alias to repo root); never `../../blocks`.
- Helpers: `createPage`, `showcase`, `element`, `picture`, `link`, `section`, `contentArgTypes`.
- Build DOM exactly as the backend delivers it, then call the decorator.
- Order: if the decorator uses `block.closest('.section')`, call `section(main, block)` first, decorate after; otherwise decorate first.
- One export per variant, plus edge cases (no image, missing cells, empty, long text). Docs description states the content model, what logs in Actions, what to check in Accessibility.
- Shared helper for two stories goes in a non-`.stories.js` file; never import one stories file from another.
- Images: `picture()` (placehold.co). No other external fetches.

### Gotchas learned the hard way
- **Variant assets 404.** Decorators lazy-load variant CSS/JS via `loadCSS(\`${window.hlx.codeBasePath}/blocks/<name>/<file>.css\`)`. Storybook only serves what `.storybook/main.js` `staticDirs` maps (currently `/icons`, `/blocks/cards`, `/blocks/columns`, `/fonts`, `/design`, `/styles`). If a story renders blank or the console shows 404 + unhandled rejection, add `{ from: '../../blocks/<name>', to: '/blocks/<name>' }`, or import the CSS statically and add a disabled placeholder `<link href=".../<file>.css">` so `loadCSS` resolves. Also import every variant CSS statically.
- **Icons/fonts 403** in CSS `url()`: the folder must also be in `viteFinal` `server.fs.allow`.
- **Brand-page variants** (cards brand/slider/product-slider, accordion brand, columns/hero brand styles) check `document.body.classList.contains('hershey-brand')`. Toggle that class in the story's render (and remove it in non-brand stories so it does not leak). The real brand theme CSS is not loaded: say colours are approximate.
- **Network/media:** mock `fetch` (Algolia, `/products/nutrition.json`, listings) narrowly and restore it; never hit YouTube or real video (poster + play button only, do not click play).
- **Layout the block assumes:** e.g. Timeline Nav's card hangs over a hero above a zero-height section; Timeline appends a spine to `main`. Add the surrounding context the live page has, or the block looks broken in isolation.
- **Randomness/timers:** wheel spins, sliders and fades finish after the click; wait before judging a screenshot.

## 4. Verify (do all of it, then say what you could not)
```bash
cd storybook && npx eslint markup && npm run build
```
- Lint: max line length 100. Fix errors in your files; report pre-existing ones elsewhere without touching them.
- Browser: `npm run dev`, open each new story via `iframe.html?id=<kebab-title>--<kebab-export>&viewMode=story`. Confirm it decorated (expected classes/children/images, no error overlay, no new console errors), exercise the interaction once (click, spin, answer), and look at a screenshot of at least one story per group. Do not `location.reload()` inside a script that must return a value.
- Stop the dev server (`pkill -f "storybook dev"`) when done.
- A story that only passes a class-name check is not verified: say so.

## 5. Report
List stories added per block/variant, what each shows, anything skipped (why), anything unfaithful (brand theme, mocked data, placeholder art), and what was not verified. Do not commit unless asked. Per AGENTS.md a PR needs a `{branch}--hersheys-eds--AdobeDrago.aem.page/{path}` link.
