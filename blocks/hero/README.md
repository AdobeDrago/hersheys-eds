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

Field table: one row per field, the field name in the first cell and the value in the second.
Rows can be left empty or removed; their value then comes from the product master sheet. This is the only
content model: rows that are not one of these fields are ignored, so a block without any field
row is filled entirely from the sheet.

| Hero (product) | |
| --- | --- |
| label | Text for the pill above the title, e.g. `Seasonal` or `Limited Edition` (those two get their icon; any other text is shown without one) |
| image-front | Scene7 image (link or URL) |
| image-back | Scene7 image (link or URL) |
| Title | Product name, shown as the page heading |
| Description | One or more paragraphs |
| size | A list of size links (current size bold or unlinked), or the current size as text |
| button | Link (e.g. Shop Now to `/where-to-buy`), or text for a Where to Buy link |

All values empty (everything from the sheet):

| Hero (product) | |
| --- | --- |
| label | |
| image-front | |
| image-back | |
| Title | |
| Description | |
| size | |
| button | |

### Page metadata

| Metadata | Use |
| --- | --- |
| `bvid` | 14-digit GTIN: finds the product's sheet row; also the Bazaarvoice rating and Shop Now SKU |
| `brand` | Tab of the product master sheet to load, e.g. `cadbury`, `hersheys`, `reeses`, `rolo`, `payday` (matched case-insensitively, punctuation ignored: `HERSHEY'S` = `hersheys`) |

### Product master sheet fallback

Authored values always win. Anything left empty is filled from the product master sheet
(`/products/product-master.json`). Only the tab named by the `brand` metadata is loaded
(`/products/product-master.json?sheet=<brand>`), and the row whose `14-Digit UPCs` (padded to 14 digits)
matches the `bvid` metadata is used. Without a `brand` row or a matching row, only the authored
values are shown.

| Left empty | Filled from |
| --- | --- |
| label | `Occasion`: `Limited Edition` shows **Limited Edition**; `Halloween`, `Easter`, `Holiday`, `Valentine's` show **Seasonal**; `Everyday` and any other occasion show no label |
| image-front | `Image URL` (alt: `imageAlt`, else `productName`) |
| image-back | `imageBack` (alt: `imageBackAlt`) |
| Title | `Short Product Title`, else `productName` |
| size | The current product first, then the products in the same tab with the same `Product Family ID (lowercase and underscores for BV)` whose `Notes` say `migrated`, so every size links to a page on this site. Links are the `Product Page URL` path without `.html` (an old `/content/hersheyland/en-us/home` prefix is removed). Labels are the `productName` after the `Short Product Title`, else `Weight (oz)` oz and `Count` `Count Unit` |
| Description | `On Page Description/product Details` |
| button | Not in the sheet: defaults to Shop Now, linking to `/where-to-buy` |

When a product page is migrated, set its row's `Notes` to `migrated` (in its brand tab) so the
other sizes in its family link to it.

The sheet is only requested when a field is missing.
The sheet must be previewed/published for the fallback to work on the site.

## Brand (`brand`)

Authored as **Hero (brand)**. Block classes: `hero brand`.

Brand landing pages (e.g. `/brands/hersheys/symphony`): warm-tan panel with the brand logo,
title and intro on the left and the brand photo filling the right half; on mobile the photo
sits on top and the text is centred. Code: `hero-brand.js` / `hero-brand.css`, loaded by
`hero.js` for this variant. The section is full-bleed with no padding.

Content model: 1 row x 2 cells, in any order.

| Hero (brand) | |
| --- | --- |
| brand photo | logo image, H1 title, intro paragraph(s) |

The logo is the picture in the same cell as the heading; any other picture is the photo.
A missing logo or photo is left out.

## Universal Editor fields

N/A (Document Authoring project)
