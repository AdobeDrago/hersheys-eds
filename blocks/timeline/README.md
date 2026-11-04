# timeline

One decade of the company history on `/about/history`: a decade label and intro, then year cards in two columns. Author one **Timeline** block per decade; the live page alternates light and dark bands.

## Authoring (Document Authoring)

Model: `standalone`

One row per item, two cells: the column (`left` or `right`) and the content.

| Timeline | |
| --- | --- |
| left | ## 1850s-90s |
| left | ### 1857 · picture · #### Milton Hershey is Born · description |
| right | ## Sweet Beginnings · intro text |
| right | ### 1894 · picture · #### The Hershey Chocolate Company · description |

- A cell with a picture is a card (h3 year, picture, h4 title, paragraphs). Anything else is an intro.
- The four digits of the first h2 become the block id (`#1850`) used by **Timeline Nav**.
- Missing cells are fine: a decade can have no right-hand intro (1940s).

## Supported variations

| Variant | Look |
| --- | --- |
| _(none)_ | tan band `#feebd0`, brown text |
| `dark` | brown band `#3c131c`, white text |

The block adds `timeline-light` / `timeline-dark` to its section so the band spans the page width.

The live page builds each card from its own one-item slider; here they are plain cards, with no slider script.
