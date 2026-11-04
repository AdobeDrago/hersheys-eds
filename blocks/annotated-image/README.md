# annotated-image

Shows one or more images with coded callout lines (dot on the image, elbow line, underlined label), plus an optional text column. Lines are drawn in CSS, positioned in % of the image, so they scale with it.

## Authoring (Document Authoring table)

| Annotated Image | | | | | |
| --- | --- | --- | --- | --- | --- |
| image | (picture) | | | | |
| callout | almond | 61.6, 57.4 | 106 | right | #0033a0 |
| callout | coconut | 53.8, 78.6 | 118 | right | |
| callout | chocolate candy | 34.4, 74.4 | 130 | right | |
| image | (picture) | | | | |
| callout | coconut | 41.9, 74.4 | 106 | left | #c8102e |
| callout | dark chocolate candy | 68.2, 63.8 | 120 | left | |
| content | Heading and paragraphs | | | | |

- `image`: starts a new figure; `callout` rows attach to the latest one.
- `callout` cells: label, `x, y` of the dot (% from the image's top-left), `y` of the label underline (%, may exceed 100 to sit below the image), `right` (default, label sits right of the line) or `left`, optional color.
- `content`: rich text shown beside (desktop) or below (mobile) the images.
- Default line color: `--hershey-component-annotated-image-line`.
- Section background: `--hershey-component-annotated-image-background` (default `#fef8ed`, matching the images).

## Universal Editor fields

N/A (Document Authoring project)
