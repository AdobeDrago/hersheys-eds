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

1. **Primitive / Reference (`reference`)**: original measurements under
   `reference.source`, brand palette, observed neutral tonal scale, validation
   error, spacing scale, tracking, stroke style, durations, delays, easing,
   shadows and z-index values. EDS-only primitives explicitly identify themselves.
2. **Semantic / System (`system`)**: surfaces, text/icons, actions, feedback,
   typography roles, layout dimensions, borders, radii, elevation and
   motion contracts. These alias the reference layer and document EDS adaptations.
3. **Component (`component`)**: header/search/submenu, footer/newsletter,
   cards/slider, columns and tabs have component-scoped aliases consumed directly
   by their CSS. Validation and action-motion contracts are recorded but are
   opt-in, not new homepage behaviors.

Example: `reference.palette.blue` -> `system.color.action` ->
`component.footer.action-surface` -> `--hershey-component-footer-action-surface`.
Some semantic aliases pass through `reference.source` to preserve provenance.

### Category coverage

| Category | Stored tokens and source context |
| --- | --- |
| Brand palette | Chocolate, seasonal purple, action blue, white; EDS hover variants explicitly labelled |
| Neutral tonal scales | Observed gray channels 0, 17, 51, 68, 153, 179, 204, 245, 246, 255; no interpolated shades |
| Surface backgrounds | Light, muted, chocolate, seasonal; header search/submenu and newsletter surfaces |
| Text and iconography | Text, on-dark, on-action, icon roles |
| Interactive states | Action default/hover, source hero hover, focus/control borders and disabled opacity |
| Feedback and validation | Original `.is-invalid` red (`#eb0029`), 3px solid border/radius; author-alert yellow kept author-only |
| Typography | Font families, responsive sizes, line heights, weights, observed letter spacing |
| Spacing and layout | Component padding/margins, content/search/submenu widths, grid gutters and flex/grid gaps |
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

Shared source colors, heading sizes, weights and line heights are consumed
through aliases. Spacing, grid widths, EDS slider controls, search styling and
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

The dependency-free generator implements only the DTCG types used here, not a
general-purpose DTCG translator. It validates types, aliases, cycles, sRGB/hex
consistency and dimensions, fails explicitly, and checks output determinism.
Generation is an authoring-time maintenance command, not a deployment build.

Test real DA content at `/` (homepage), `/nav` and `/footer`; no authoring or
cloud-content changes are required by the token refactor. Compare computed
styles before/after at 375px, 768px and 1440px, and exercise keyboard tabs,
sliders and responsive navigation.
