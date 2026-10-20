# Design agent guidance

- Follow the repository root AGENTS.md. Do not modify vendored scripts/aem.js.
- Design evidence comes from https://www.hersheyland.com/ and its AEM
  `/etc.clientlibs/` CSS, including cascade, media conditions and inline styles.
  Never extract original design values from the EDS preview.
- Review source-observations.json, source-clientlib-foundations.json and README.md before changing tokens.
  Re-measure the original site when evidence is missing. Do not guess values.
- Use the stable DTCG 2025.10 format in tokens.json: `$type`, `$value`,
  `$description`, structured color/dimension values and `{path}` aliases.
- Preserve the reference -> system -> component architecture.
  Keep original measurements in `reference.source`. Component tokens alias
  semantic roles; avoid embedding raw primitive values in block CSS.
  Mark EDS-only adaptations explicitly.
  Do not overwrite source evidence to match the implementation.
- Preserve original font binaries and image assets. Never approximate imagery
  or import the original tracking, widget or CMP code with the clientlibs.
- Edit tokens.json, then run `node design/generate-tokens.mjs`.
  Do not hand-edit tokens.css. Keep generation dependency-free and development
  only; EDS serves committed CSS without a build step.
- Keep `--hershey-*` variables scoped to the branded theme/header/footer.
  Reusable variants need existing-value fallbacks outside the branded scope.
  Never change default block styling as a side effect of a token extraction.
- Maintain all documented token categories. Do not invent missing success,
  warning or informational colors, and do not apply author-only feedback styles
  to users. Record motion contracts without enabling new animations implicitly.
- Do not use CSS variables in media-query conditions or font-face descriptors.
  Keep documented responsive thresholds aligned with CSS and JavaScript.
- Validate with `node design/generate-tokens.mjs --check`,
  `node --test test/design-tokens.test.mjs`, `npm run lint`,
  `./node_modules/.bin/stylelint design/tokens.css` and `git diff --check`.
- Verify real authored homepage and standalone branded chrome in the browser
  at mobile, tablet and desktop widths. Test tabs, navigation and sliders.
- Document intentional visual changes; otherwise require computed-style parity.
  Source JSON and generated CSS must stay synchronized.
