# search-recipes

Algolia-backed recipe search (query, facets, sort, pagination) for the all-recipes experience.

## Authoring (Document Authoring)

Model: `standalone`

Add an empty **search-recipes** block table on the page. The block loads results from Algolia on decorate — no hit cells are authored.

Optional config rows (key | value):

| Key | Value |
| --- | --- |
| `hits-per-page` | Number of cards per page (default `20`) |
| `endpoint` | Worker/proxy URL; when set, the client POSTs here instead of Algolia |
| `asset-origin` | Origin for DAM images / recipe paths (default `https://www.hersheyland.com`) |

## Data source

- App ID: `DQJUL6CPHC` (search-only key in [`scripts/recipes-search.js`](../../scripts/recipes-search.js))
- Filter: `metaTags.templateType: recipe-detail`
- Indexes: newest / rating / A–Z (same as hersheyland.com)

**Confirm with Hershey:** if the search key gets HTTP-referrer restrictions limited to hersheyland.com, either allowlist `localhost` + `*.aem.page` / `*.aem.live` (preferred) or set `endpoint` to a Cloudflare Worker proxy. Do not create a Worker until that happens.

## Supported variations

No variations.
