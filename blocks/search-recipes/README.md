# search-recipes

Algolia-backed listing (search banner, collapsible facets, sort, "Show More") for the all-recipes and activities experiences.

## Authoring (Document Authoring)

Model: `standalone`

Add a **search-recipes** block table on the page. The block loads results from Algolia on decorate — no hit cells are authored.

Config rows (key | value), all optional:

| Key | Value |
| --- | --- |
| `title` | Banner heading (default per listing) |
| `placeholder` | Search field placeholder (default per listing) |
| `background` | Banner picture (the block's own colour shows behind it) |
| `hits-per-page` | Number of cards per page (default `20`) |
| `endpoint` | Worker/proxy URL; when set, the client POSTs here instead of Algolia |
| `asset-origin` | Origin for DAM images / recipe paths (default `https://www.hersheyland.com`) |

## Data source

- App ID: `DQJUL6CPHC` (search-only key in [`scripts/recipes-search.js`](../../scripts/recipes-search.js))
- Filter: `metaTags.templateType: recipe-detail` (recipes) or `craft-detail` (activities)
- Indexes: newest / rating / A–Z (same as hersheyland.com)

**Confirm with Hershey:** if the search key gets HTTP-referrer restrictions limited to hersheyland.com, either allowlist `localhost` + `*.aem.page` / `*.aem.live` (preferred) or set `endpoint` to a Cloudflare Worker proxy. Do not create a Worker until that happens.

## Supported variations

| Variant | Listing |
| --- | --- |
| _(none)_ | all-recipes |
| `activities` | activities: Category, Seasons & Occasions, Skill Level facets; "Show More Crafts" |

New listings (stories, products) are added as an entry in `LISTING_TYPES` in [`scripts/recipes-search.js`](../../scripts/recipes-search.js) plus the variant name in `LISTING_VARIANTS` in the block.
