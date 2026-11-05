---
name: block-to-story
description: Create or update Storybook stories for blocks in blocks/. Use when a block is new or changed and has no story, or the user says "add this block to storybook". Pass block names, or no args to find blocks without stories.
---

# block-to-story

Turn a block in `blocks/<name>/` into a story in `storybook/markup/<name>.stories.js` that renders the production decorator and CSS with author-shaped markup.

## 1. Find targets
- Args given: use those block names.
- No args: a block needs a story if no file under `storybook/markup/` contains `blocks/<name>/`. List `blocks/*/` and grep.
- Skip with a one-line note: `fragment` (loader), `instagram` (external Elfsight script), and `header`/`footer` (already in `page-structure.stories.js`). Ask only if unsure.

## 2. Read the block before writing
- `blocks/<name>/<name>.js`: the header comment and the code define the content model (rows, cells, which elements are queried), variants (`block.classList.contains(...)`), and side effects (section classes, `document.body` classes, appended elements, localStorage, timers).
- `blocks/<name>/README.md` if present: the authoring table.
- All `blocks/<name>/*.css`: import every variant stylesheet the story can switch on.
- Check how the block is used on a real page when the model is unclear: `curl localhost:3000/<path>.plain.html` (needs `npx -y @adobe/aem-cli up`). Never edit `scripts/aem.js` or the block.

## 3. Write the story
Follow existing stories (`tabs`, `banner`, `social-share`, `link-group`, `poll`) and `storybook/markup/story-helpers.js`:
- Imports: `import decorateX from '@adobe/aem-boilerplate/blocks/<name>/<name>.js'` and the `.css` files (the alias maps to the repo root). Never import from `../../blocks`.
- Helpers: `createPage`, `showcase`, `element`, `picture`, `link`, `section`, `contentArgTypes`.
- Build the DOM exactly as the backend delivers it (rows of `div`s, cells as `div`s, `<picture>` + `<a>` where authored), then call the decorator.
- Call order: if the decorator uses `block.closest('.section')`, call `section(main, block)` first and decorate after. Otherwise decorate first.
- `export default { title: 'Blocks/<Title Case>', render, args, argTypes, parameters.docs.description.component }`. The description states: production decorator and CSS, the content model, what interactions log in Actions, and what to check in Accessibility.
- Stories: `Default`, one per variant (read the variant list from the JS/CSS/README), and edge cases the code handles (no image, missing cells, empty, long text).
- Controls for what authors vary: text, counts (`range`), variant (`select`), booleans for optional parts. Defensive decoration matters: authors omit and add cells, so include a story for it.
- Helper shared by two stories goes in a non-`.stories.js` file (e.g. `timeline-fixture.js`), never imported from another stories file.
- Network: use `picture()` (placehold.co). No other external fetches.

## 4. Verify
```bash
cd storybook && npx eslint markup/<name>.stories.js && npm run build
```
Fix lint errors in your files only (max line length 100). Report pre-existing lint errors in other files without touching them. If a browser is available, run `npm run dev` and open the story; check the interactions listed in the description. Otherwise say it was build-checked only.

## 5. Report
Say which stories were added, what each variant shows, anything skipped and why, and what was not verified. Do not commit unless asked. Per AGENTS.md, a PR needs a `{branch}--hersheys-eds--AdobeDrago.aem.page/{path}` link.
