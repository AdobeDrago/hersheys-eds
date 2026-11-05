# dynamic-feed

Custom block. Purpose: show live data from any public JSON REST API as cards. The block fetches
the API in the visitor's browser, picks the array of items out of the response, maps each item's
fields onto a card (title, description, image, link, date) and renders them as a grid, a list or a
carousel. Demo: `/dynamic` (Spaceflight News API).

## Authoring (Document Authoring)

Model: `standalone`

Key/value rows: the left cell names the setting, the right cell holds its value. Rows can be in
any order; only `endpoint` is required.

| Dynamic Feed (grid) | |
| --- | --- |
| endpoint | https://api.spaceflightnewsapi.net/v4/articles/?limit=6 |
| items | results |
| fields | title=title;description=summary;image=image_url;link=url;date=published_at |
| next | next |
| max | 6 |
| columns | 3 |

| Row | Meaning | Default |
| --- | --- | --- |
| `endpoint` | The API URL. Must be `https` and allow cross-origin requests (CORS). A pasted link is fine. | none: the block shows "No items available" |
| `items` | Dot path to the array of items in the response, e.g. `results`, `data.results`, `items`. Leave empty when the response itself is an array. | the response itself |
| `fields` | `card field=JSON path` pairs separated by `;`. Card fields: `title`, `description`, `image`, `link`, `date`. Paths can go deeper, e.g. `image=media.0.url`. Leave a field out to hide it. | `title=title;description=description;image=image;link=url;date=date` |
| `next` | Where the next page is, for the **Load more** button. A dot path to a next-page URL (`next`, `links.next`), or `path=param` for a cursor, e.g. `meta.cursor=cursor` sends the cursor back as `?cursor=…`. | tries `next`, `links.next`, `paging.next`; no button when none is a URL |
| `image base` | The site that serves the images, for APIs that return paths without a site (`/content/dam/…`), e.g. `https://www.hersheyland.com`. | the endpoint's site |
| `max` | Items shown per page (per load). | 6 |
| `columns` | Cards per row on desktop (900px and wider), grid layout only. | 3 |

### Layout options

- **Dynamic Feed** or **Dynamic Feed (grid)**: one column on mobile, two from 600px, `columns`
  from 900px.
- **Dynamic Feed (list)**: one card per row; image on the left from 600px.
- **Dynamic Feed (carousel)**: a horizontal track that snaps card by card, about 80% card width on
  mobile and three cards per view on desktop. Swipe, scroll, or focus it and use the arrow keys.

### What the visitor sees

- While loading: grey placeholder cards.
- If the API fails, times out (8 seconds), blocks CORS, or returns no items: "No items available".
  If **Load more** fails, the cards already shown stay and the button can be pressed again.
- A card without a title or a link is skipped. A card without an image shows text only.
- Image alt text is the card title, or "Feed image" when there is none.
- Responses are cached in the browser for 5 minutes per session, so reloading the page doesn't
  call the API again.
- A block below the first section waits until it scrolls into view before calling the API.

### Notes

- The block runs in the browser, so **never put an API key or secret in the page**. Use only public
  APIs, or a proxy you control.
- API values are always shown as plain text; HTML in the response is not rendered.
- Only `https` links and images are used.
- Images from other sites are lazy loaded as they are; EDS image optimisation only applies to
  images on this site.

## Example configs

### Hersheyland chocolate recipes (Algolia search, as used by hersheyland.com)

The same search index and public search-only key as `scripts/recipes-search.js`. Algolia accepts
the credentials as query parameters, so a plain GET works. `filters` keeps recipe pages only;
change `query` (`brownies`, `cookies`, `s'mores`) to change the recipes.

`{ "hits": [{ "hero": { "h1", "description", "image": "/content/dam/…" }, "url": { "href" } }], "nbPages": 114 }`

| Dynamic Feed (grid) | |
| --- | --- |
| endpoint | https://DQJUL6CPHC-dsn.algolia.net/1/indexes/crawler_www.hersheyland.com?query=chocolate&hitsPerPage=6&filters=metaTags.templateType%3Arecipe-detail&x-algolia-application-id=DQJUL6CPHC&x-algolia-api-key=a6b8675cb5520e40ee6756581786eccd |
| items | hits |
| fields | title=hero.h1;description=hero.description;image=hero.image;link=url.href |
| image base | https://www.hersheyland.com |

Images are paths on hersheyland.com, hence `image base`. Algolia pages by number, so there is no
Load more.

### Chocolate desserts (TheMealDB)

`{ "meals": [{ "strMeal", "strInstructions", "strMealThumb", "strSource" }] }`

| Dynamic Feed (carousel) | |
| --- | --- |
| endpoint | https://www.themealdb.com/api/json/v1/1/search.php?s=chocolate |
| items | meals |
| fields | title=strMeal;description=strInstructions;image=strMealThumb;link=strSource |
| max | 12 |

Some recipes have no `https` source; those cards show without a link.

### Space news grid with Load more (Spaceflight News API)

`{ "count": 36796, "next": "https://…?offset=6", "results": [{ "title", "summary", "image_url", "url", "published_at" }] }`

| Dynamic Feed (grid) | |
| --- | --- |
| endpoint | https://api.spaceflightnewsapi.net/v4/articles/?limit=6 |
| items | results |
| fields | title=title;description=summary;image=image_url;link=url;date=published_at |
| next | next |

The same API has `/v4/blogs/` and `/v4/reports/` with the same shape.

### Latest tech stories as a list, no images (Hacker News via Algolia)

`{ "hits": [{ "title", "url", "created_at" }], "page": 0, "nbPages": 50 }`

| Dynamic Feed (list) | |
| --- | --- |
| endpoint | https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=10 |
| items | hits |
| fields | title=title;link=url;date=created_at |
| max | 10 |

This API pages with a page number rather than a next URL, so there is no Load more.

### Photo carousel from a root array (JSONPlaceholder)

`[{ "title", "url", "thumbnailUrl" }]`

| Dynamic Feed (carousel) | |
| --- | --- |
| endpoint | https://jsonplaceholder.typicode.com/photos?_limit=12 |
| items | |
| fields | title=title;image=url;link=url |
| max | 12 |

`items` is empty because the response is the array itself.

## Universal Editor fields

N/A (Document Authoring project)
