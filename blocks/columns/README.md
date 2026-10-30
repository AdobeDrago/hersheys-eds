# columns

Columns block. Layout variants keep authored rows. Recipe ingredients and nutrition facts live in the [recipe-details](../recipe-details/README.md) block.

## Default

The decorator counts the columns and marks image-only cells. `feature` and `homepage-hero` are layout classes on the same block. The wrapper and section are `columns-wrapper` and `columns-container`.

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

## Universal Editor fields

N/A (Document Authoring project)
