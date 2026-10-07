# Hersheyland Edge Delivery Services

Authorable migration of the Hersheyland homepage using original source images
and licensed Gazpacho and TT Norms Pro fonts.

## Homepage authoring

Edit [the homepage in DA](https://da.live/edit#/adobedrago/hersheys-eds/index).
The `Template` metadata value `hershey-home` loads the homepage-only theme.
Navigation and footer content are also migrated and managed separately.

- **Columns (homepage-hero):** text, heading and CTA in the first cell;
  desktop and mobile images (in that order) in the second. One image also works.
- **Cards (welcome-cards):** one row per category, image | heading/link and text.
- **Cards (slider, products)** and **Cards (slider, related):** one row per card,
  image | heading/link and optional description. Native scrolling and arrow
  controls work without a third-party carousel.
- **Columns (feature):** text and CTA | image.
- **Tabs (recipes):** one row per recipe collection, label | image, heading and
  paragraph. Additional content cells are retained. Tabs support Left/Right,
  Home and End keys.
- **Cards (social):** image | caption with the original Instagram post link.
  This is an editable eight-post snapshot, not a live Instagram widget.

Section `Style` values are `halloween`, `welcome`, `newest`, `creme`, `recipes`,
`chocolate`, `social` and `related`. The welcome section contains the original
desktop/mobile decorative images in pairs. Preserve their order.

Images are stored in DA under `.index/`; EDS ingests them into its media bus
when the document is previewed. Preview content after editing it in DA.
Code changes and content publishing are separate: merging code does not publish
the homepage content.

### Header and footer

Edit [navigation in DA](https://da.live/edit#/adobedrago/hersheys-eds/nav) and
[the footer in DA](https://da.live/edit#/adobedrago/hersheys-eds/footer).
Navigation uses three sections: linked logo (`Style: hershey-nav`), a nested
list of categories and links, and a link to the existing Hersheyland search page.
The search link becomes a GET form using the source service's `searchQuery`
parameter. Submenu images are the original source icons.

Footer section styles are `newsletter`, `footer-brand`, `footer-links` and
`footer-legal`. Newsletter signup continues on Hersheyland; this site does not
collect email addresses. Social links are text-labelled instead of loading
Font Awesome. Cookie preferences link to Hersheyland; its OneTrust CMP and
tracking scripts are not installed here. Existing local consent behavior is
unchanged.

## Design tokens

The [design folder](./design/README.md) contains a DTCG 2025.10 token catalog,
original Hersheyland AEM clientlib measurements, and a generated CSS variable
stylesheet consumed by the homepage, cards, columns, tabs, header and footer.
Original source values are separate from documented EDS compatibility mappings.
After changing tokens, run `node design/generate-tokens.mjs`, then
`node design/generate-tokens.mjs --check`. No runtime build is required.

## Environments
- Preview: https://main--hersheys-eds--AdobeDrago.aem.page/
- Live: https://main--hersheys-eds--AdobeDrago.aem.live/

## Documentation

Before using the aem-boilerplate, we recommand you to go through the documentation on https://www.aem.live/docs/ and more specifically:
1. [Developer Tutorial](https://www.aem.live/developer/tutorial)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

1. Create a new repository based on the `aem-boilerplate` template
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `hersheys-eds` directory in your favorite IDE and start coding :)
