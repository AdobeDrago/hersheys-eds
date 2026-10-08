# Hersheyland Storybook

Development-only Storybook 10.6.1 with HTML + Vite. All dependencies are isolated
devDependencies; EDS does not gain a framework or build step. Requires Node
20.19+ or 22.12+. Storybook source, fixtures, reports and static output are
excluded from EDS delivery by `.hlxignore`.

```sh
npm --prefix storybook ci
npm run storybook
npm run storybook:build
npm run storybook:test
npm run storybook:test:browser
npm run lint
```

Open <http://localhost:6006>. Static output goes to
`storybook/storybook-static/`. No CMS, DA authentication or EDS development
server is required. Storybook telemetry is disabled.

## Navigation and Autodocs

The sidebar order is **Foundations → Default Content → Blocks → Widgets**.
Each component/element has a generated **Docs** page through
`@storybook/addon-docs` and the global `autodocs` tag. Default Content has no
intermediate “Semantic Elements” folder: Heading 1–6, Paragraph, Strong,
Emphasis, Citation, Link, Buttons, Unordered List, Ordered List, Blockquote,
Image, Table and Divider are direct children, each with its own Autodocs.

Docs provide descriptions, interactive examples, source and documented
argument tables. A shared Autodocs template shows the primary specimen once,
then the remaining variants, avoiding duplicated navigation IDs and handlers.
Its React doc blocks belong only to Storybook; site components remain HTML.
The Canvas addon panel stays visible for Controls, Actions
and Accessibility.

## Live specimens and themes

Foundations is a **designer-facing comparison workspace**, not a dictionary
browser. Start at Overview to review the palette, full type hierarchy and
action states together. Color compares the full palette and surfaces in use;
Typography compares typefaces, size, weight, reading rhythm and tracking;
Spacing, Shape, Elevation and Motion show visual relationships immediately.
There are no token selectors, architecture pages, source-measurement screens,
dependency chains or provenance panels in this browsing experience.
Engineering details remain in [design documentation](../design/README.md).

Default Content retains each element as a direct child with its own Autodocs,
and adds an Overview showing a realistic page composition. Individual pages
start with contextual comparisons: short/wrapping headings, narrow/comfortable
reading measures, all action treatments, or contrasting image proportions.
**Presentation** switches between Compare, In a page and Isolated.
Hide annotations for a clean visual review.

Controls are exploration tools: sample copy, heading/type scale, reading width,
leading, tracking, alignment, spacing scale, corner rounding, image proportions,
captions and candidate colors. Changes are preview-only and resettable using
Storybook's Reset Controls; the production dictionary and site CSS are untouched.
Viewport presets provide Mobile (375px), Tablet (768px), and Desktop (1440px).

The toolbar switches between Hersheyland and **Cocoa**, a Storybook-only
preview theme, not a new production brand theme. The decorator applies theme
classes separately to every `[data-showcase]` boundary, including all Autodocs
canvases. It never themes `html`, `body`, documentation chrome or the sidebar.
The theme is a [DTCG overlay](../design/themes/cocoa.tokens.json), compiled by
the same dictionary as production. Storybook CSS contains no hardcoded semantic
theme overrides. Semantic/component roles inherit the selected theme and their
paired foreground/background roles. Palette annotations report active CSS
colors, without exposing implementation identifiers. Candidate colors may fail
contrast checks; use Accessibility while exploring and reset to designed defaults.

The generated runtime and preview CSS dictionaries are imported,
not copied. After changing the catalog or theme overlay, run
`node design/generate-tokens.mjs`; builds and tests check every generated artifact.
Original authorized fonts are served locally.
The Vite dev-server allowlist explicitly includes only the project's font
directory in addition to its existing workspace roots. Imported production
font-face URLs otherwise resolve to `/@fs/…` and return 403, causing silent
Helvetica fallbacks even though the configured family names look correct.
Rendered-font tests use Chrome's platform-font API to verify the actual TT
Norms Pro and Gazpacho faces across every showcase type, not just CSS names.
TT Norms Pro 500 uses the available regular face because there is no separate
local medium font file. Undefined customer success/info/warning colors are
not invented. Author-only colors are not part of the designer palette.

All image fixtures use <https://placehold.co/>. Image alternatives remain
editable independently from captions in the Image story.

## Controls and Actions

Controls are explicit `argTypes` with descriptions, appropriate input types
and source-backed options. They edit headings, copy, optional images, card
counts and variants, tab labels, link destinations and widget inputs.
Default Content documents relevant controls for each element. Storybook URLs
can preserve arguments so visual experiments can be shared without changing
the authored site or its design values.

Actions record `navigate`, `activate`, `change`, `submit` and keyboard
`select tab` events. They observe real decorated elements through bubbling,
without replacing production interaction handlers. Links and form submissions
are prevented from navigating away from Storybook; widget output still updates.
Static elements explicitly document that they have no actions.

## Blocks and local fixtures

Cards, Columns and Tabs use production decorators and CSS. Cards include
default, welcome, products, related, social, slider and text-only variants.
Hero uses production CSS: its empty decorator does not make it unavailable.
Its stacking context is contained by the showcase.

Header and Footer run production decorators. Only their `loadFragment`
dependency is redirected by a Storybook Vite alias to local author-shaped
navigation/footer fixtures. The real `scripts.js` page bootstrap is not
imported. Storybook sets the EDS `codeBasePath` to its static-asset root rather
than Vite's filesystem module URL. Header positioning is contained within
the specimen instead of fixing navigation over the documentation.
Fragment's visual story showcases composed content. The browser suite also
exercises the real Fragment decorator and section replacement using an absolute
authored URL against the requested branch's `/nav` content.

The production Widget Loader fetches local mock HTML, CSS and JS from the
Storybook-only `/widgets` static mapping. **Widgets / Interactive Fixture**
shows a labeled form and live result. Both are explicitly mocks: this
repository still has no production widget implementation. Fixture assets
are not shipped by EDS.

## Accessibility and regression testing

`@storybook/addon-a11y` runs axe against `[data-showcase]`, not the Docs UI.
Its `a11y.test: 'error'` configuration treats violations as failures when
used with a compatible Storybook test integration. The independent Playwright
suite also runs axe and fails on violations without disabling rules.

`npm run storybook:test` checks token resolution, coverage, aliases and
design-facing labels. `npm run storybook:test:browser` checks every story in
both themes, desktop/tablet/mobile overflow, Autodocs theme isolation,
per-element documentation hierarchy, token selection, keyboard tabs, reduced
motion, loaded widget assets, live announcements and real placeholder loading.
It also checks multiple header instances, widget error propagation and
concurrent stylesheet loads, optional Columns images, real Fragment URL
handling, and production Hero empty-image behavior.
Rendered-font checks verify the actual regular, bold, black and italic faces.
It uses installed Google Chrome by default. To use a provisioned Playwright
browser or another installed channel:

```sh
STORYBOOK_BROWSER_CHANNEL=chromium npm run storybook:test:browser
```

In CI, provision the selected browser beforehand. The test configuration starts
Storybook if necessary and reuses a running instance outside CI. Failure traces
are written to ignored `storybook/test-results/`.
The browser suite also starts or reuses an EDS server at port 3000 for the real
Fragment check, using the requested branch's content. To run it manually:

```sh
npx -y @adobe/aem-cli up --url https://migrate-hersheyland-homepage--hersheys-eds--adobedrago.aem.page --no-open
```

Automated checks cannot establish full accessibility. Also use Tab/Shift+Tab,
visible focus, Left/Right/Home/End in tabs, Escape in navigation, zoom/reflow,
a screen reader for widget announcements, and reduced-motion preferences.
Motion is explicitly triggered and runs once. Selected primitive tokens may
not suit every arbitrary foreground/background pairing; use the Accessibility
panel when exploring nondefault combinations.
