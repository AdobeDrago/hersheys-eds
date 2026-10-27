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
in the second. Rows can be left empty or removed; their value then comes from the product
master sheet.

| Hero (product) | |
| --- | --- |
| image-front | Scene7 image (link or URL) |
| image-back | Scene7 image (link or URL) |
| Title | Product name, shown as the page heading |
| Description | One or more paragraphs |
| size | A list of size links (current size bold or unlinked), or the current size as text |
| button | Link (e.g. Shop Now to `/where-to-buy`), or text for a Where to Buy link |

The older 2-cell layout (images | name, sizes, description, CTA) still works.

### Product master fallback

Authored values always win. Anything left empty is filled from the product master sheet
(`/products/product-master.json`, first sheet), using the row whose `path` matches the page
(or whose `gtin` matches the `bvid` metadata):

| Left empty | Filled from |
| --- | --- |
| image-front | `image` (alt: `imageAlt`, else `title`) |
| image-back | `imageBack` (optional column; alt: `imageBackAlt`) |
| Title | `name` |
| size | Active products with the same `familyId`, the current one first. Labels are the `title` after the name, else `weight` oz and `count` `countUnit` |
| Description | `description` |
| button | Not in the sheet: defaults to Shop Now, linking to `/where-to-buy` (field table only) |

The sheet can use these short column names, or the Hershey product master columns, which are
mapped onto them:

| Short name | Product master column |
| --- | --- |
| `path` | `Product Page URL` (its path) |
| `gtin` | `14-Digit UPCs` / `upc` (padded to 14 digits) |
| `name` | `Short Product Title` |
| `title` | `productName` |
| `image` | `Image URL` |
| `description` | `On Page Description/product Details` |
| `familyId` | `Product Family ID (lowercase and underscores for BV)` |
| `brandActive` | `Brand Active` |
| `weight`, `count`, `countUnit` | `Weight (oz)`, `Count`, `Count Unit` |

The sheet is only requested when a field is missing.
The sheet must be previewed/published for the fallback to work on the site.

## Universal Editor fields

N/A (Document Authoring project)
