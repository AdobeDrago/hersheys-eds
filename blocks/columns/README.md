# columns

Columns block. Layout variants keep authored rows. Recipe ingredients and nutrition facts live in the [recipe-details](../recipe-details/README.md) block

## Default

The decorator counts the columns and marks image-only cells. `feature` and `homepage-hero` are layout classes on the same block. The wrapper and section are `columns-wrapper` and `columns-container`.

Option `portrait` (`Columns (portrait)`): the image is drawn 633px tall (476px below 900px) and cropped at the sides; from 900px it fills half the row and the band's full height, with the text beside it. Used for the Milton Hershey illustration on `/about`.

## Fact (`fact`)

Authored as **Columns (fact)**. Brand pages: a "Did You Know?" quick fact. A 16:9 illustration sits beside an H3 and a paragraph. The image takes a third of a ten-column container, and the text sits 50px lower. Cells keep their authored order (image first or text first) at every width. Below 992px the cells stack and are centred. The text colour comes from `component.columns.fact.color-foreground`, which brand themes override (for example `symphony-primary`).

| Columns (fact) | |
| --- | --- |
| image | H3, paragraph |

## Callout (`callout`)

Authored as **Columns (callout)**. Brand pages: a wide image (about 58% on desktop) beside
centred text: H2, paragraph, a bold link (pill button) and an italic link (underlined text
link), side by side on desktop and stacked on mobile.

| Columns (callout) | |
| --- | --- |
| image | H2, paragraph, **bold link**, *italic link* |

## Article (`article`)

Authored as **Columns (article)**. An eyebrow, heading, copy, pill button and text link beside a
photo, e.g. the S'mores feature on `/brands/hersheys/cookies-n-creme`. The eyebrow is the paragraph
before the heading; the bold link is the button and the italic link the text link. Below 992px the
photo sits on top and the copy is centred.

| Columns (article) | |
| --- | --- |
| photo | eyebrow, H3, paragraph, **bold link**, *italic link* |

Options:

- `panel` (`Columns (article, panel)`): the copy sits on a purple panel that the photo overlaps,
  e.g. the attractions on `/about/visit`. The photo keeps its authored side from 992px (put the
  photo cell first for a photo on the left) and sits on top, rising above the panel, below 992px.
  A single button keeps its own width. The heading's id is what a `Jump Links (text)` link points at.
- `yellow` (`Columns (article, panel, yellow)`): a yellow panel with maroon copy.
- `tan` (`Columns (article, panel, tan)`): a greige panel with maroon copy and 90px above and
  below the band from 992px, e.g. the timeline and visit panels on `/about`.

Each further row is another panel, 60px below the one before (160px from 992px).

A band of brand tiles (`Cards (slider, brands)`) next to a panel sits closer to it.

## Follow (`follow`)

Authored as **Columns (follow)**. Copy and a row of social links beside a portrait video, e.g.
"So really, Hersheyland is yours" on `/about`. Links to TikTok, Instagram, Facebook, Pinterest and
YouTube show the site's icon (from `/icons/social-*.svg`); the link text stays as the accessible
name. In the video cell, a link to an `.mp4` file (or a YouTube URL) next to the poster becomes a
play button that swaps the poster for the player. The poster is 600px tall and cropped; it is 302px
wide from 992px. Below 992px the cells stack and the icons wrap.

| Columns (follow) | |
| --- | --- |
| paragraphs, paragraph of social links | poster picture, [Play video](/path/to/video.mp4) |

## Universal Editor fields

N/A (Document Authoring project)
