# jump-links

Custom block. Purpose: in-page navigation. A grid of icon tiles that each link to a section further
down the page, as "Jump to a Section" on
[hersheyland.com/about/faqs](https://www.hersheyland.com/about/faqs.html).

## Authoring (Document Authoring)

Model: `standalone`

One row per tile: an icon (an SVG or image) and a link. The cells can be in either order. Put the
section heading ("Jump to a Section") above the block as default content.

| Jump Links | |
| --- | --- |
| ![Question mark icon](icon_trending.svg) | [Trending Questions](#trending-topics) |
| ![Candy bar icon](icon_manufacturing.svg) | [Manufacturing & Products](#manufacturing--products) |

Each link points at a heading on the same page with `#` and the heading's id. The id is the heading
text in lower case, with spaces turned into hyphens and punctuation removed, so
"Trending Topics" is `#trending-topics` and "Manufacturing & Products" is `#manufacturing--products`
(the `&` leaves a double hyphen).

- A row without a link is left out.
- A row without an icon becomes a tile with only its label.
- The icon is decorative; the link text names the tile.

## Layout

- Below 768px: one tile per row, icon then label.
- From 768px: two 2:1 tiles per row, icon centred above the label.
- From 992px: three tiles per row; the band has no top padding, so it continues a hero above it.

The band colour comes from the section. On /about/faqs the hero and the jump links sections both use
Section Metadata `Style: cream`.

## Universal Editor fields

N/A (Document Authoring project)
