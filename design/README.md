# Hersheyland design

## Source of truth

The design source is **https://www.hersheyland.com/**, not the EDS migration.
Extraction on 2026-10-07 inspected the original page's AEM clientlibs via CSSOM
and computed styles at 375px, 768px and 1440px.
[source-observations.json](./source-observations.json) preserves the measured
styles, selectors, conditions and originating clientlib URLs.
[source-clientlib-foundations.json](./source-clientlib-foundations.json)
captures neutral, validation, letter-spacing, shadow, stacking and motion
declarations across the original clientlibs. These include search and authoring
rules that are not active on the homepage.

The source serves fingerprinted CSS under `/etc.clientlibs/hershey/`. The
relevant libraries are:

| Clientlib | Design information |
| --- | --- |
| `clientlibs/clientlib-site-revised` | TT Norms Pro, Gazpacho, body and responsive heading typography |
| `components/section/clientlib-section-default-theme` | Light/dark text and section surfaces |
| `components/generic-hero/clientlib-generic-hero-default-theme` | Hero line height and primary action styles |
| `components/text/clientlib-text-default-theme` | Rich-text heading weight and line height |
| `components/call-out-card/clientlib-call-out-card-default-theme` | Card text and imagery |
| `components/tabs/clientlibs-tabs-default-theme` | Recipe tab styling |
| `components/hub-navigation/clientlib-singlelayer-hub-navigation-default-theme` | Branded navigation |
| `components/hub-footer/clientlib-hub-footer-default-theme` | Branded footer |

Clientlib fingerprints are deployment-specific. Re-extract URLs from the
original page's stylesheet links rather than hardcoding a hash or copying the
entire AEM bundle. Inline seasonal section styles and the cascade matter too.
The source root is 10px: `3.6rem` there means 36px. Do not transfer rem values
unchanged to EDS, whose root font size differs.

## Tokens

[tokens.json](./tokens.json) uses the latest stable
[DTCG Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/).
This is a W3C Community Group specification, not a W3C Recommendation.

- `$type`, `$value` and `$description`, with inherited group types.
- Structured sRGB colors (`colorSpace`, normalized `components`, `alpha`, `hex`).
- Structured dimensions (`value`, `unit`), numeric weights/line heights,
  font-family arrays, named stroke styles and composite shadows.
- Durations use `{value, unit}` and easing uses four-coordinate `cubicBezier`
  values, not untyped CSS strings.
- `{token.path}` aliases; no proprietary `value`/`type` format.

### Core architecture layers

1. **Reference values (`reference`)** describe reusable ingredients:
   `color.brand`, `color.neutral`, `spacing`, `typography`, `shape.radius`,
   `border.width`, `size`, `opacity`, `elevation`, `shadow` and `motion`.
   Font sizes, spacing, border widths and radii have independent primitive
   identities even when their numeric values happen to match.
2. **System roles (`system`)** describe purpose and state:
   `color.text.primary`, `color.surface.inverse`,
   `color.action.primary.background.hover`, `typography.body.font-size`,
   `spacing.inset.comfortable`, `spacing.gap.default`, and
   `elevation.layer.navigation`. Roles always alias reference values or another
   system role; they never contain arbitrary literals.
3. **Component contracts (`component`)** describe parts and properties:
   `header.search.background`, `footer.newsletter.action.foreground`,
   `cards.image.border-radius`, and `tabs.control.selected.background`.
   Every component token aliases a system role, never a primitive directly.

Example:
`reference.color.brand.blue` →
`system.color.action.primary.background.default` →
`component.footer.newsletter.action.background` →
`--hershey-component-footer-newsletter-action-background`.

**Source evidence is not a fourth runtime design layer.** `reference.source`
retains original measurements separately from reusable values. Runtime roles
cannot depend on it. Source font sizes and radii are preserved even where EDS
uses different values. The original author-alert yellow and Coral/icon-selector
grays (17, 68 and 245) belong to authoring evidence, not the customer palette.
Neither source evidence nor authoring-only colors are exported in production
`tokens.css`. The generated `source-tokens.css` remains an engineering artifact;
it is not imported or exposed by the designer-facing Storybook.

### Dictionary metadata and validation

Groups inherit types and common metadata rather than repeating configuration
on every token. The DTCG `$extensions["com.hersheyland.tokens"]` namespace
contains `scope`, `origin`, `category` and `cssProperty`; optional `audience`,
`label`, `categories` and `pair` clarify specialized usage.
`scope` is `runtime`, `evidence` or `preview`.

`category` and `cssProperty` classify the dictionary. Storybook uses those
classifications internally to build curated visual comparisons, not to expose
the token tree to designers. Category,
type and property combinations are validated together. Semantic foreground
and background roles specify their `pair`; component aliases inherit that
pairing through the dictionary.

[token-dictionary.mjs](./token-dictionary.mjs) is the shared dependency-free
resolver/compiler for CSS generation, tests and Storybook. It validates
inherited types, alias type compatibility, missing references, cycles,
CSS-variable naming collisions, layer boundaries, evidence isolation,
metadata contracts, color consistency and composite shadows. Nested shadow
aliases and multiple shadow layers are supported without discarding aliases
in generated CSS. Invalid data fails explicitly.

### Preview themes

[themes/cocoa.tokens.json](./themes/cocoa.tokens.json) is a typed DTCG overlay
for the existing **Storybook-only Cocoa** preview. It adds preview reference
colors and overrides existing system color roles. It cannot override source
evidence, create unknown system roles, change token types or bypass semantics
with component overrides.

The generator merges the overlay and emits `themes/cocoa.css`, re-binding
the same semantic/component graph at each showcase boundary. No semantic color
overrides are hardcoded in Storybook CSS. Neither preview assets nor the
authoring-time dictionary module are shipped by EDS.

### Category coverage

| Category | Stored tokens and source context |
| --- | --- |
| Brand palette | Chocolate, seasonal purple, action blue; existing EDS deeper variants explicitly labelled |
| Neutral values | Customer-observed channels 0, 51, 153, 179, 204, 246, 255; authoring-only 17, 68, 245 retained separately; no interpolated shades |
| Surface backgrounds | Light, muted, chocolate, seasonal; header search/submenu and newsletter surfaces |
| Text and iconography | Primary/inverse text, inline links, primary icons and paired action foregrounds |
| Interactive states | Default/hover primary actions, selected control background/foreground, focus widths/offsets and disabled opacity |
| Feedback and validation | Original `.is-invalid` red (`#eb0029`); existing EDS 3px border/radius contracts are adaptations, not newly claimed measurements; author-alert yellow is evidence-only |
| Typography | Font families, responsive sizes, line heights, weights, observed letter spacing |
| Spacing and layout | Separate inset, control, action, section and gap roles; page/search/popover containers and control/media dimensions |
| Shape and borders | Card/tab/search/menu radii, control/divider/focus widths, solid stroke style |
| Depth and elevation | Original search shadow, EDS submenu shadow, original stacking layers and safe EDS header layer |
| Motion and animation | Original 150/250/300/400/1000/2000ms durations, zero interaction delay, animation-library delays of 1-5s, standard/linear/out/in-out cubic curves and reduced duration |

No original end-user success, warning or informational feedback palette was
established. Do not invent colors or repurpose `.author-alert` for users.
Motion tokens record existing source contracts; the refactor does not add
transitions/animations to previously static EDS components. Existing reduced-motion
handling for native sliders remains unchanged.

### Deliberate EDS compatibility mappings

This is a token refactor, not a second visual redesign. Existing migration
choices are preserved and are **not** represented as original-site values:

| Property | Original source | Existing EDS mapping |
| --- | --- | --- |
| Body font size/weight | 17px / 500 | 18px / existing inherited weight |
| Mobile h2 | 28px | 30px |
| Rich-text heading line height | 1.3 | Hero's 1.2 |
| Hero button hover | `#268fc7` | `#005f84` |
| Mobile navigation height | 60px | 80px |
| Card image radius | 8px | 24px |
| Tab radius | 50px | 30px |
| Heading fallback family | TT Norms Pro, sans-serif | sans-serif |

Equivalent runtime reference values preserve shared source colors, heading
sizes, weights and line heights without making live roles depend on the
measurement registry. Spacing, grid widths, EDS slider controls, search styling and
focus indicators remain EDS adaptations. The source recipe tabs use a nested
label; the outer tab's measured 10px font size is not a label-size token.

### Runtime integration

[tokens.css](./tokens.css) is a committed generated artifact, served as static
CSS. EDS does not run a build or parse JSON at runtime.
[loadHersheyTheme](../scripts/hershey-theme.js) loads it and the theme in parallel
using the existing EDS `loadCSS` helper. Homepage, independently authored header
and independently authored footer all use that shared loader.

Variables have the prefix `--hershey-` and are scoped to `.hershey-home`,
`.header.hershey-nav` and `.footer.hershey-footer`. Nothing is assigned on
`:root`. Reusable card, column and tab variants retain literal fallbacks outside
the branded theme; default cards/columns and unbranded chrome are unchanged.
The source AEM clientlibs are evidence, **not** a runtime dependency.

Zero, `auto`, percentages, aspect ratios and grid structure remain CSS.
Media queries retain literal 600px/900px EDS thresholds because CSS custom
properties cannot be used in media-query conditions. Matching dimension tokens
document those values; update queries and JavaScript thresholds together when
intentionally changing responsiveness.
Font-face declarations retain static paths/descriptors; CSS variables cannot
parameterize them. The six authorized original fonts remain in `fonts/`.

## Updating and validating

Edit JSON, never the generated stylesheet:

```sh
node design/generate-tokens.mjs
node design/generate-tokens.mjs --check
node --test test/design-tokens.test.mjs
npm run lint
./node_modules/.bin/stylelint design/tokens.css
git diff --check
```

Generation produces `tokens.css` (runtime), `source-tokens.css`
(Storybook evidence) and `themes/cocoa.css` (Storybook preview). `--check`
verifies all three artifacts, not just the default palette.
The generator implements the DTCG types used here, not a general-purpose DTCG
translator. Generation is an authoring-time maintenance command, not a
deployment build.

Test real DA content at `/`, `/nav` and `/footer` on
<https://migrate-hersheyland-homepage--hersheys-eds--adobedrago.aem.page/>.
Local testing uses that content with local code via `aem up --url` for the same
origin. No authoring or cloud-content changes are required.
Compare computed styles before/after at 375px, 768px and 1440px, and exercise
keyboard tabs, sliders and responsive navigation.

### Migration from the previous dictionary

| Previous path | Current role |
| --- | --- |
| `system.color.action-hover` | `system.color.action.primary.background.hover` |
| `system.font.size.h1-desktop` | `system.typography.heading-1.font-size.desktop` |
| `system.spacing.large` | `system.spacing.inset.comfortable` |
| `component.header.search-surface` | `component.header.search.background` |
| `component.cards.image-radius` | `component.cards.image.border-radius` |

CSS-variable names follow these paths. All repository consumers were migrated
together; legacy aliases are not retained as a second dictionary.
Production computed styles remain unchanged. Storybook uses designer language,
full palettes/type scales, contextual comparisons and preview-only exploration
controls. Architecture, source/authoring evidence and provenance stay in this
engineering documentation, not in Foundations navigation. Color annotations
report active themed CSS values. Existing motion contracts remain opt-in.

### Block implementation audit

All eight block implementations and stylesheets were reviewed.

| Block | Design contracts and implementation findings |
| --- | --- |
| Cards | Grid minimum width, gap, border, background, body inset and heading families now use component roles alongside existing slider/variant contracts. Image links preserve authored accessible names or image alternatives. |
| Columns | Default and variant gaps use component roles. A two-picture homepage hero no longer assumes the desktop picture contains the fallback `img`. |
| Header | Branded padding, logo width, type weights/line height and menu icon dimensions use component roles. Navigation/submenu IDs and Escape handling are instance-local, not a hardcoded global `#nav`. Missing navigation fragments fail explicitly. |
| Footer | Existing typed newsletter/layout/action contracts are retained. Missing footer fragments fail explicitly instead of dereferencing null. |
| Tabs | Selected foreground/background are wired to their component contracts. Labels remain authored; invalid rows already log explicit authoring errors. |
| Hero | Padding, minimum height, heading width and image foreground use component roles. Image stacking is contained, supporting copy is readable over the image, and an omitted image uses normal text foreground. |
| Fragment | Absolute authored page URLs normalize to local content paths; missing sources, missing wrappers and failed fragments fail explicitly. |
| Widget | Missing/invalid source links and HTTP failures are rejected, not rendered as successful error HTML. Concurrent instances share stylesheet completion; camelCase and kebab-case query metadata are supported. |

Numbers **inside `var(--hershey-…, fallback)` are intentional compatibility
fallbacks**, not the primary branded design source. Removing them would break
reusable blocks outside the Hersheyland scope. Generic boilerplate chrome
defaults that are superseded by branded selectors are also retained.
Zero/reset values, percentages, aspect ratios, grid counts, flex proportions,
icon drawing coordinates and rotations are structural CSS, not token inventory.
The literal 600px/900px CSS and JavaScript breakpoints must stay aligned.

JavaScript ARIA roles, generated-ID prefixes, the `/nav` and `/footer` metadata
defaults, `/widgets` asset conventions, first-tab selection, the 512-character
search limit, the slider's 1px scroll tolerance and 750px image-delivery width
are content/runtime contracts, not typography or color values. Navigation/footer
URLs already accept authored metadata overrides. Changing accessibility copy
or localization is separate from design-token extraction.

The authored homepage, `/nav` and `/footer` retain their computed styles.
The CSS-only Hero corrections affect image layering/copy and its empty-image
state; Storybook now demonstrates those production styles without compensating
mock overrides. Font binaries are unchanged.
