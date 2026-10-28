# Third-party loading

How Bazaarvoice, Wayvia (PriceSpider), Algolia, Adobe Launch and OneTrust load on this site,
what each one waits for, and what the page does when one is slow or fails.

## Loading phases

Pages load in three phases (see `loadPage()` in `scripts/scripts.js`):

1. **Eager**: the first section, up to its first image (the largest contentful paint).
   No block in it waits on a third party.
2. **Lazy**: the header, then the remaining sections one at a time, then the footer. The
   footer and the delayed phase wait for every section, so a block must never wait on a
   vendor without a time limit.
3. **Delayed**: `scripts/delayed.js`, imported 3 seconds after the lazy phase, and only once
   the page is shown (a page the browser prerendered in the background waits until it is
   activated; see `whenActivated()`).

## Requirements by integration

| Integration | Needed for | Loads when | Phase | Consent | If slow or failing |
|---|---|---|---|---|---|
| **OneTrust** | Cookie banner, preference center, consent state | 3 s after the lazy phase | Delayed | None: it collects consent | No banner; consent stays declined, so Adobe Launch never loads. The footer cookie link goes to its original address. |
| **Adobe Launch** | Analytics | After OneTrust reports Performance (C0002) consent, and only when the page sets `launch-url` metadata | Delayed, after consent | Performance (C0002) required | Console warning; nothing else depends on it. |
| **Bazaarvoice** | Star rating next to the product title, reviews, Q&A | Pages with a `[data-bv-show]` container, 3 s after the lazy phase | Delayed | Renders for everyone. Its tracking cookies (`BVBRANDID`, `BVBRANDSID`) are set only with Performance consent and are removed when consent is withdrawn | The reviews widget shows "couldn't be loaded" straight away if `bv.js` fails, or 8 s after it was requested if nothing renders. The star rating by the title stays empty. |
| **Wayvia (PriceSpider)**: widget | Where to Buy retailers and prices | When the where-to-buy widget block loads, once the page is shown | Lazy | `ps-widget.js` loads for everyone (it is the page's purpose). The tracking-id script `ps-utid.js` loads only with Performance consent, including consent given later. When the URL has a `utid` parameter it sets `ps-utid` and `ps-utparam` cookies, which are removed when consent is withdrawn | The widget shows "couldn't be loaded" if `ps-widget.js` fails, or if nothing renders within 15 s. |
| **Wayvia (PriceSpider)**: Shop Now warm-up | Faster Where to Buy after Shop Now | Product pages with a Shop Now link, once the page is shown | Delayed (start) | None: a prefetch and a prerender hint | Nothing; the click still navigates normally. |
| **Algolia**: recipe search | Search results, filters, paging | Right away when the block is in the first section (as on `/recipes/all-recipes`, where the results are the main content); otherwise the first time it is on screen | Eager or lazy, depending on the section; the block never waits for the results | None: no cookies; `analytics=false` | "Unable to load recipes" if the request fails, or after 8 s without an answer. |
| **Algolia**: related products | Related Products cards | When the block loads; the section waits for it | Lazy | None: no cookies; `analytics: false` | The authored cards stay. The request gives up after 4 s, so later sections and the footer are never held up longer. |

Why each one sits where it does:

- **Main content loads with its block.** Search results are the search page's purpose and
  retailers are the Where to Buy page's purpose, so they load as soon as their block is
  ready or visible, not 3 s later. Their blocks never wait for the vendor, so first paint
  isn't held up even where the search block is the first section.
- **Supporting content waits for the delayed phase.** Reviews and Q&A sit below the fold
  and the consent banner is not page content, so both wait until the page has rendered.
  The cost is that the star rating next to a product title appears about 3 s after the
  page loads.
- **Analytics waits for consent.** Adobe Launch runs only after the visitor allows
  Performance cookies.

## Consent

- **Consent category:** `scripts/consent-state.js` reads OneTrust's Performance group (C0002)
  from `window.OnetrustActiveGroups`.
- **Listening for changes:** `scripts/consent-check.js` listens through `OptanonWrapper`,
  which OneTrust calls on load and whenever preferences change. It fires a
  `consent.update` event (`detail.consented`) and loads `scripts/consented.js` once
  consent is given.
- **Withdrawing consent:** if Adobe Launch was already requested, the page reloads,
  because Launch can't be unloaded.
- **Footer link:** the "Cookie Preferences" link opens OneTrust's preference center. If
  OneTrust hasn't loaded yet, the click starts it.
- **Testing override:** `?consent=accept` or `?consent=decline` overrides the consent
  state, on localhost and `*.aem.page` previews only. It is ignored on the live site, so a
  shared link can't grant consent for someone.

## Configuration

| Setting | Where | Default |
|---|---|---|
| `onetrust-id` | Page metadata | Hershey's OneTrust test script for stage.hersheyland.com |
| `launch-url` | Page metadata | None: Adobe Launch is off. Hershey's own Launch libraries are refused. |
| `bazaarvoice-url` | Page metadata | Hershey's `bv.js` deployment |
| Delay before the delayed phase | `loadDelayed()` in `scripts/scripts.js` | 3000 ms |
| Algolia related-products time limit | `RELATED_TIMEOUT` in `blocks/cards/cards-product.js` | 4000 ms |
| Recipe search time limit | `SEARCH_TIMEOUT` in `blocks/search-recipes/search-recipes.js` | 8000 ms |
| Reviews fallback | `FALLBACK_DELAY` in `widgets/bazaarvoice/reviews.js` | 8000 ms after `bv.js` is requested |
| Where to Buy fallback | `FALLBACK_DELAY` in `widgets/pricespider/where-to-buy.js` | 15000 ms |

## Measurements (October 28, 2026)

Lab runs, median of 3 per page: `main`'s preview (before) against the branch preview (after).
Mobile uses Lighthouse's default throttling (4x CPU, 150 ms latency, 1.6 Mbps); desktop is
unthrottled. Vendor beacons to Hershey's accounts were blocked in both.

| Page (mobile) | FCP before / after | LCP before / after | CLS before / after | Vendor requests before page load |
|---|---|---|---|---|
| Home | 1608 / 1588 ms | 1608 / 1588 ms | 0.002 / 0.002 | 0 / 0 |
| Product (Reese's OREO) | 1220 / 1240 ms | 2740 / 2760 ms | 0.043 / 0.043 | 0 / 0 |
| Recipe (Best Brownies) | 1592 / 1588 ms | 1592 / 1588 ms | 0 / 0 | 0 / 0 |
| Where to Buy | 620 / 652 ms | 2788 / 2812 ms | 0.532 / 0.532 | 1 / 1 |
| Recipe search | 1012 / 852 ms | see below | 0.483 / 0.457 | 0 / 0 |

- **First paint and the page's own largest paint** are unchanged within noise, and no vendor
  request starts before the page has rendered. The one request before the load event on
  Where to Buy is the PriceSpider widget, which is that page's content.
- **Where vendors now run:** OneTrust and Bazaarvoice now start about 3 s after load. On
  the recipe page, a vendor request moved from about 0.1 s to about 3.1 s after load
  (desktop).
- **Cookie banner as largest paint:** on mobile recipe search, the content's largest paint
  is 2.25 s (2.45 s before). The cookie banner arrives at about 6 s, though, and on that
  page it is the largest element on screen, so Lighthouse can report it as the largest
  contentful paint. That is the cost of delaying OneTrust on pages with little above-fold
  content.
- **Layout shift:** the high values on recipe search and Where to Buy come from search
  results and the PriceSpider widget filling in without reserved space. They are the same
  on `main`.
- **Blocking time:** goes up by about 25 ms once the delayed vendors run (mobile). No
  blocking task happens before the load event, on either side.

Regression (27 checks, all passing): recipe search (query, filter, clear, sort, paging,
`analytics=false`), related products, reviews and Q&A, Where to Buy from Shop Now,
fallbacks when a vendor is blocked or hangs, Adobe Launch only with consent (Hershey's
library refused), consent banner, accept, withdraw, and the footer link. Bazaarvoice sets
`BVBRANDID` and `BVBRANDSID` only with consent. Before any choice, the only cookie is
OneTrust's `OptanonConsent`.

## Not handled in this code

These belong to each vendor's own setup, not to the site:

- **Bazaarvoice domain allowlist.** Reviews render only on allowlisted domains. Every
  `*.aem.page` preview currently gets "Bazaarvoice is not configured for the domain",
  and the reviews fallback shows.
- **Wayvia script 404.** `omni/script.js` returns 404 on Where to Buy. The widget still
  renders.
- **Data that reaches Hershey's accounts.** See the next section.

## Data sent to Hershey's accounts

This prototype must not send analytics to Hershey. Measured October 28, 2026 by blocking and
counting every request to an analytics endpoint, with no consent choice, after Reject All and
after Accept All:

| Integration | Analytics sent to Hershey | Notes |
|---|---|---|
| Adobe Launch | None | Off unless `launch-url` is set; Hershey's libraries are refused |
| Algolia | None | Searches send `analytics=false`; no Insights events |
| OneTrust | None observed | Hershey's test script (stage.hersheyland.com), not production |
| **Bazaarvoice** | **Yes: 13 beacons per product page view** to `network-a.bazaarvoice.com` | **Accepted exception** |
| **Wayvia (PriceSpider)** | **Yes: 3 event beacons per Where to Buy view** to `wtbevents.pricespider.com` (account 2366) | **Accepted exception** |

The two exceptions are kept so reviews and Where to Buy work on the prototype. Consent does
not change them: both vendors send these beacons after Reject All too. Consent only controls
Bazaarvoice's tracking cookies and PriceSpider's `ps-utid.js`. Every visit also uses Hershey's
Algolia, Bazaarvoice and PriceSpider accounts to read search results, reviews and retailers.
