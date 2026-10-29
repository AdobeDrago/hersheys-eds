# columns

Columns block. Layout variants keep authored rows. The `recipe` variant is the authored **Columns (Recipe)** ingredients and directions experience. The `nutrition` variant is the authored **Columns (Nutrition)** facts label and contact box.

## Default

The decorator counts the columns and marks image-only cells. `feature` and `homepage-hero` are layout classes on the same block. The wrapper and section are `columns-wrapper` and `columns-container`.

## Recipe (`recipe`)

Authored as **Columns (Recipe)**. Block classes: `columns recipe`.

Purpose: recipe-method.

Add the section heading and summary immediately before the block:

- `Ingredients & Directions`
- `Yields: 48 cookies`
- `Prep: 20 Min. | Bake: 11 Min. | Total: 31 Min.`

The block uses one row with two cells:

1. `Ingredients` heading followed by an unordered list.
2. `You'll Need` heading and unordered list, followed by a `Directions` heading and ordered list. Step images belong inside their corresponding list items. An optional final paragraph beginning with `Tip:` becomes the Tip disclosure on the last step.

Authored ingredients take priority: when the ingredients cell has any content besides its heading (a list, or one paragraph per ingredient), only that content is shown. When the cell has just the heading (or is left empty), the block uses the `/recipes/ingredients` sheet row whose `pagepath` matches the page.

Decoration adds Bake Mode and marks the section with `columns-recipe-section`. On supported browsers, its switch uses the Screen Wake Lock API to keep the display awake while the recipe is being followed. The wrapper and section remain `columns-wrapper` and `columns-container`.

## Nutrition (`nutrition`)

Authored as **Columns (Nutrition)**. Block classes: `columns nutrition`.

Purpose: nutrition-label.

The block uses one row with two cells:

1. `Nutrition Facts` heading, servings and serving-size paragraphs, a calories paragraph, a nutrient list, and a footnote paragraph.
2. `Additional questions?` heading and a contact link. The link is rendered as a button.

Decoration marks the section with `columns-nutrition-section`. The wrapper and section remain `columns-wrapper` and `columns-container`.

## Universal Editor fields

N/A (Document Authoring project)
