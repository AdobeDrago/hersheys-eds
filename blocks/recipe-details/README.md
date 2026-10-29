# recipe-details

Recipe Details block for recipe pages. It needs a variant: **Recipe Details (Ingredients)** builds the ingredients and directions experience, and **Recipe Details (Nutrition)** builds the Nutrition Facts label and contact box. Each variant loads its own script and stylesheet (`recipe-details-<variant>.js` / `.css`). Without a variant the authored content is left as is.

The wrapper and section are `recipe-details-wrapper` and `recipe-details-container`.

## Ingredients (`ingredients`)

Authored as **Recipe Details (Ingredients)**. Block classes: `recipe-details ingredients`.

Purpose: recipe-method.

Add the section heading and summary immediately before the block:

- `Ingredients & Directions`
- `Yields: 48 cookies`
- `Prep: 20 Min. | Bake: 11 Min. | Total: 31 Min.`

The block uses one row with two cells:

1. `Ingredients` heading followed by an unordered list.
2. `You'll Need` heading and unordered list, followed by a `Directions` heading and ordered list. Step images belong inside their corresponding list items. An optional final paragraph beginning with `Tip:` becomes the Tip disclosure on the last step.

Authored ingredients take priority: when the ingredients cell has any content besides its heading (a list, or one paragraph per ingredient), only that content is shown. When the cell has just the heading (or is left empty), the block uses the `/recipes/ingredients` sheet row whose `pagepath` matches the page.

Decoration adds Bake Mode and marks the section with `recipe-details-ingredients-section`. On supported browsers, its switch uses the Screen Wake Lock API to keep the display awake while the recipe is being followed.

## Nutrition (`nutrition`)

Authored as **Recipe Details (Nutrition)**. Block classes: `recipe-details nutrition`.

Purpose: nutrition-label.

The block uses one row with two cells:

1. `Nutrition Facts` heading, servings and serving-size paragraphs, a calories paragraph, a nutrient list, and a footnote paragraph.
2. `Additional questions?` heading and a contact link. The link is rendered as a button.

Decoration marks the section with `recipe-details-nutrition-section`.

## Universal Editor fields

N/A (Document Authoring project)
