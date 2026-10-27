/**
 * Accordion block: a list of questions that expand to show an answer.
 *
 * Content model: one row per item, two cells (question | answer).
 *   Question: a line of text; inline formatting is kept.
 *   Answer: any content (paragraphs, lists, links).
 * Each row becomes a native `details`/`summary`, so keyboard and screen reader
 * behaviour comes from the browser. Rows without a question are dropped.
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [label, ...answer] = row.children;
    if (!label?.textContent.trim()) {
      row.remove();
      return;
    }

    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    // authors usually wrap the question in a paragraph or heading; keep only its content
    const wrapper = label.children.length === 1 && /^(P|H[1-6])$/.test(label.firstElementChild.tagName)
      ? label.firstElementChild : label;
    summary.append(...wrapper.childNodes);

    const body = document.createElement('div');
    body.className = 'accordion-item-body';
    answer.forEach((cell) => body.append(...cell.childNodes));

    const item = document.createElement('details');
    item.className = 'accordion-item';
    item.append(summary, body);
    row.replaceWith(item);
  });
}
