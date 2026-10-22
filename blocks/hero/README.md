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

## Universal Editor fields

N/A (Document Authoring project)
