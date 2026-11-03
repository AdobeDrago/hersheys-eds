# details-and-directions

Details and Directions block for activity (craft) pages: the You'll Need supplies, the step-by-step directions and Make Mode. Recipe pages use [recipe-details](../recipe-details/README.md) instead.

Author it as plain **Details and Directions** and add a Section Metadata block in the same section:

| Section Metadata | |
| --- | --- |
| Style | activities |

Without the `activities` style the block logs an error and the authored content is left as is.

Purpose: activity-method.

The wrapper and section are `details-and-directions-wrapper` and `details-and-directions-container`.

## Content

Add the section heading and summary immediately before the block:

- `You'll Need & Step-by-Step Directions`
- `Yields: 1 web` (optional)
- `Make Mode: Prevent your screen from going dark.` (optional; sets the switch text and is not shown as a paragraph)

The block uses one row with two cells:

1. `You'll Need` heading followed by an unordered list of supplies. A leading amount (`8`, `2 tsp`, `1/2 cup`) is set apart from the name.
2. `Directions` heading and ordered list. Step images belong inside their corresponding list items. An optional final paragraph beginning with `Tip:` becomes the Tip disclosure on the last step. A heading-led tools list before the directions becomes a disclosure.

The cell holding the ordered list is treated as the directions cell, regardless of order.

### Supplies from the sheet

Authored supplies always win. When the first row has no supply items (the cell is missing, empty, or holds only a heading), the block reads `/activities/youllneedsteps.json` and uses the row whose `pagepath` matches the page (`/activities/x.html` matches `/activities/x`). Its non-empty `youllneed1` to `youllneed14` columns become the list, in column order. A missing heading defaults to `You'll Need`.

Sheet values are plain text plus optional `<a href=...>` links; other markup is shown as text. Links to `www.hersheyland.com` become site-relative without `.html` (`/products/x`), like authored links. If the page has no sheet row, the block shows the directions only.

## Decoration

- Marks the section with `details-and-directions-section`: grey band with a lime wave (`#b7d34a`).
- Adds the **Make Mode** switch. On supported browsers it uses the Screen Wake Lock API to keep the display awake.
- Outlines the supplies and directions panels in the pale lime craft border (`#dbe9a5`).
- Adds a "done" checkbox to each direction step.

## Universal Editor fields

N/A (Document Authoring project)
