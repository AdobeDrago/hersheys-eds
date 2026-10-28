# hero

Hero block. The default treatment is CSS-only. The `recipe` variant is the authored **Hero (Recipe)** overview.

## Default

The decorator leaves authored content in place. A picture is the full-bleed background, and the section wrapper drops the page max-width and padding. Without a picture, text uses the normal foreground.

## Recipe (`recipe`)

Authored as **Hero (Recipe)**. Block classes: `hero recipe`.

Purpose: recipe-overview.

Content model: 1 column x 2 rows (row order is not enforced).

- Image row: the hero image.
- Text row: category link paragraph (pill), H1 title, `Skill Level: ...` paragraph, optional further paragraphs.

Decoration adds the Bazaarvoice rating from `bvid` (or `bv-id`) metadata and the share bar. This variant keeps the page section width and padding. The wrapper and section are `hero-wrapper` and `hero-container`.

## Product (`product`)

Authored as **Hero (product)**.

Product overview on product pages: image gallery, product name, size list, description,
Shop Now. Code: `hero-product.js` / `hero-product.css`, loaded by `hero.js` for this variant.

### Authoring (Document Authoring)

Field table (recommended): one row per field, the field name in the first cell and the value
in the second. Rows can be left empty or removed; their value then comes from the pdp sheet.

| Hero (product) | |
| --- | --- |
| image-front | Scene7 image (link or URL) |
| image-back | Scene7 image (link or URL) |
| Title | Product name, shown as the page heading |
| Description | One or more paragraphs |
| size | A list of size links (current size bold or unlinked), or the current size as text |
| button | Link (e.g. Shop Now to `/where-to-buy`), or text for a Where to Buy link |

The older 2-cell layout (images | name, sizes, description, CTA) still works.

### Page metadata

| Metadata | Use |
| --- | --- |
| `bvid` | 14-digit GTIN: finds the product's sheet row; also the Bazaarvoice rating and Shop Now SKU |
| `brand` | Tab of the pdp sheet to load, e.g. `cadbury`, `hersheys`, `reeses`, `rolo`, `payday` (matched case-insensitively, punctuation ignored: `HERSHEY'S` = `hersheys`) |

### pdp sheet fallback

Authored values always win. Anything left empty is filled from the pdp sheet
(`/products/pdp.json`). Only the tab named by the `brand` metadata is loaded
(`/products/pdp.json?sheet=<brand>`), and the row whose `14-Digit UPCs` (padded to 14 digits)
matches the `bvid` metadata is used. Without a `brand` row or a matching row, only the authored
values are shown.

| Left empty | Filled from |
| --- | --- |
| image-front | `Image URL` (alt: `imageAlt`, else `productName`) |
| image-back | `imageBack` (alt: `imageBackAlt`) |
| Title | `Short Product Title`, else `productName` |
| size | The current product first, then the products in the same tab with the same `Product Family ID (lowercase and underscores for BV)` whose `Notes` say `migrated`, so every size links to a page on this site. Links are the `Product Page URL` path without `.html` (an old `/content/hersheyland/en-us/home` prefix is removed). Labels are the `productName` after the `Short Product Title`, else `Weight (oz)` oz and `Count` `Count Unit` |
| Description | `On Page Description/product Details` |
| button | Not in the sheet: defaults to Shop Now, linking to `/where-to-buy` (field table only) |

When a product page is migrated, set its row's `Notes` to `migrated` (in its brand tab) so the
other sizes in its family link to it.

The sheet is only requested when a field is missing.
The sheet must be previewed/published for the fallback to work on the site.

## Universal Editor fields

N/A (Document Authoring project)
