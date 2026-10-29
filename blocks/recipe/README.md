# recipe

Recipe detail page rendered from recipe JSON. One block serves every recipe page.

The block replaces its section with authored-style sections for existing blocks, which own all decoration and styling:

1. **Breadcrumb Trail**: Hersheyland > Recipes > category
2. **Hero (Recipe)**: category pill, title, skill level, share bar, image, description
3. **Columns (Recipe)**: Ingredients & Directions summary, Bake Mode, ingredients, tools, directions, tip
4. **Columns (Nutrition)**: Nutrition Facts label and the customer service box (only when `nutrition` is present)

## Authoring (Document Authoring)

Model: `standalone`

Add an empty **recipe** block to the page. The slug is the last URL segment, so `/recipes/hersheys-perfectly-chocolate-chocolate-cake` loads `hersheys-perfectly-chocolate-chocolate-cake`. To test a recipe on a draft page, type the slug into the block's single cell.

Set page metadata `template: hershey-recipe` to load the Hershey theme tokens.

## Data source

`RECIPE_ENDPOINT` in `recipe.js` is a URL template with `{slug}`. It points at `mocks/{slug}.json` until the third-party API is available.

The third-party API is private. Never call it, or ship its credentials, from this block: everything under `blocks/` is public. Point `RECIPE_ENDPOINT` at a server-side proxy (App Builder action or CDN worker) that holds the credentials and returns this shape:

| Field | Type | Required |
| --- | --- | --- |
| `title` | string | yes |
| `ingredients` | string[] (non-empty) | yes |
| `directions` | string[] (non-empty) | yes |
| `description` | string | no |
| `image` | `{ src, alt }`, `src` is https or a hersheyland.com DAM path | no |
| `category` | `{ name, url }`, `url` is a site path or https | no |
| `skillLevel`, `yield`, `tip` | string | no |
| `tools` | string[] (the "You'll Need" list) | no |
| `prepTime`, `cookTime`, `totalTime` | integer minutes (`cookTime` shows as Bake) | no |
| `nutrition` | `{ servings, servingSize, calories, nutrients }` | no |

`nutrients` is a list of `{ name, amount, dailyValue, nutrients }`, where the nested `nutrients` are sub-nutrients (e.g. Saturated Fat under Total Fat). See the mock for a full label.

Responses that miss a required field show an error message instead of a partial recipe.

## Supported variations

No variations.
