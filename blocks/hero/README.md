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

Decoration adds the Bazaarvoice rating from `bvid` (or `bv-id`) metadata and the share bar. The bar opens with Facebook, Pinterest, email, print and copy-link. Its share icon collapses it to a blue pill with just the share icon and copy-link, and expands it again. This variant keeps the page section width and padding. The wrapper and section are `hero-wrapper` and `hero-container`.

Activity pages (`/activities/...`) use the same block. Skill Level and `bvid` are optional. When the image row holds more than one image, they become a gallery with previous/next buttons centred at the bottom of the image; only the first image loads eagerly. On activity pages the share and print labels say "activity" instead of "recipe".

The same overview can be authored as plain **Hero** with a Section Metadata block on the same section:

| Section Metadata | |
| --- | --- |
| Style | carousel |

The block then gets the `recipe` class and renders exactly like **Hero (Recipe)**. Put two or more images in the image row for the slider; with one image it shows a single image.

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

Options:

- `square` (`Hero (brand, square)`): a square photo on top below 992px; from 992px the photo half is
  740px tall and the text is centred in the other half (e.g. `/brands/hersheys/cookies-n-creme`).
- `overlap` (`Hero (brand, square, overlap)`): below 992px the title rises 60px over the bottom of
  the photo, for photos that fade into the panel colour (e.g. `/about/faqs`).

The panel colour comes from the brand theme. In a section with Section Metadata `Style: cream`
(e.g. `/about/faqs`) the panel is light cream (`#fef3e3`).

## Marquee (`marquee`)

Authored as **Hero (marquee)**. Block classes: `hero marquee`.

Brand hero for campaign pages (e.g. `/oreo-cup`): four rows of scrolling text on a band tilted 10
degrees behind a logo, an intro paragraph and a product photo, on the brand band colour. Code:
`hero-marquee.js` / `hero-marquee.css`, loaded by `hero.js` for this variant. The two ticker
strips (`icons/hero-marquee-ticker-left.svg`, `icons/hero-marquee-ticker-right.svg`) are
decoration, not authored content; the left one is over the 40KB limit for images authored on a
page. The section is
full-bleed with no padding.

Content model: 1 row x 2 cells.

| Hero (marquee) | |
| --- | --- |
| logo image, intro paragraph | product photo |

The logo and photo should be transparent PNGs or WebPs. The copy is centred vertically beside
the photo; on screens under 900px the two stack. The ticker stops for visitors who prefer
reduced motion.

### Text band (`band`)

Authored as **Hero (marquee, band)**. Block classes: `hero marquee band`.

A band of lettering instead of a hero, e.g. "Tastes like good memories" and "It's your happy place"
on `/hersheys`: rows of one wide strip scrolling sideways at 24px a second, each row in the
opposite direction to the one above. Code: the `band` branch of `hero-marquee.js` and the
`.hero.marquee.band` rules in `hero-marquee.css`.

Content model: 1 row x 1 cell holding the strip, either a picture or a link to an image file (use a
link for a strip over the 40KB limit for images authored on a page, e.g. a file in `/icons`); its
alt text or link text is the readable copy. Add `rows-N` to change the number of rows (default 4).
The block is clipped to the height the page theme sets with `--hero-marquee-band-height`, so the
last row can be cut off. The ticker stops for visitors who prefer reduced motion.

| Hero (marquee, band) |
| --- |
| [Tastes like good memories](/icons/hersheys-tastes-like-good-memories.svg) |

## Universal Editor fields

N/A (Document Authoring project)

## Hero (article) colour

Author the block as plain `Hero (article)`. Set the band colour with a Section Metadata block on the same section:

| Section Metadata | |
| --- | --- |
| Style | navy |

Styles: `blue` (same as the default), `purple`, `lime`, `gold`, `brown`, `navy`, `plum`. Without a style the band is the default blue. Old names like `Hero (article, navy)` no longer colour the band.
