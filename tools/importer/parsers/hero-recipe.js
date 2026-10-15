/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-recipe. Base: hero (custom local block, blocks/hero-recipe/hero-recipe.js).
 * Source: https://www.hersheyland.com/recipes/reeses-oreo-cup-brownies.html
 * Block contract: 1 column x 2 rows.
 *   Row 1: hero image.
 *   Row 2: <p> with the category link (rendered as a pill), <h1> title, <p>Skill Level: X</p>.
 * Not authored (block-generated): BV star rating (from bvid metadata) and the share bar.
 * Source DOM (.hersheyland-us-recipe):
 *   span.label > a                     category link
 *   h1                                 title
 *   .rating .parentVariance            span.h5 "Skill Level:" + span.h4 "Beginner"
 *   .share-nav                         share icons (skipped)
 *   .recipe-card .carousel img         hero image (first)
 *   .desc-section .description         intro copy -> moved out after the block as default content
 */
export default function parse(element, { document }) {
  // Category pill link
  const categoryLink = element.querySelector('.label a[href], span.label a, .category a[href]');

  // Title
  const heading = element.querySelector('h1') || element.querySelector('h2');

  // Skill level ("Skill Level:" + "Beginner")
  let skillText = '';
  const variance = element.querySelector('.parentVariance');
  if (variance) {
    const label = variance.querySelector('.h5, span:first-of-type');
    const value = variance.querySelector('.h4, span:last-of-type');
    const l = label ? label.textContent.replace(/\s+/g, ' ').trim() : 'Skill Level:';
    const v = value && value !== label ? value.textContent.replace(/\s+/g, ' ').trim() : '';
    skillText = `${l.replace(/:?\s*$/, ':')} ${v}`.trim();
  }

  // Hero image: first real (non data-uri) image in the recipe card / carousel
  const images = [...element.querySelectorAll('.recipe-card img, .carousel img, .item img, img')]
    .filter((img) => {
      const src = img.getAttribute('src') || '';
      return src && !src.startsWith('data:') && !img.closest('.rating, .share-nav, .desc-section');
    });
  const heroImage = images[0];

  // Intro copy: section default content that lives inside this element. Collected now,
  // re-inserted after the block below.
  const descSection = element.querySelector('.desc-section');
  const descContent = [];
  if (descSection) {
    const source = descSection.querySelector('.description') || descSection;
    [...source.children].forEach((child) => {
      if (child.tagName === 'P') {
        // Split paragraphs on <br><br> runs so each authored paragraph stays separate.
        let current = document.createElement('p');
        const flush = () => {
          if (current.textContent.trim() || current.querySelector('img')) descContent.push(current);
          current = document.createElement('p');
        };
        const nodes = [...child.childNodes];
        for (let i = 0; i < nodes.length; i += 1) {
          const n = nodes[i];
          if (n.nodeType === 1 && n.tagName === 'BR') {
            // look ahead for a second <br> (ignoring whitespace) -> paragraph break
            let j = i + 1;
            while (j < nodes.length && nodes[j].nodeType === 3 && !nodes[j].textContent.trim()) j += 1;
            if (j < nodes.length && nodes[j].nodeType === 1 && nodes[j].tagName === 'BR') {
              flush();
              i = j;
              continue;
            }
            current.append(n);
          } else if (n.nodeType === 1 && n.matches('span.caption')) {
            // caption gets its own paragraph (emphasised)
            flush();
            const em = document.createElement('em');
            em.append(...n.childNodes);
            current.append(em);
            flush();
          } else {
            current.append(n);
          }
        }
        flush();
      } else if (child.textContent.trim()) {
        descContent.push(child);
      }
    });
  }

  if (!heading && !heroImage) {
    element.replaceWith(...descContent);
    return;
  }

  const cells = [];
  if (heroImage) cells.push([heroImage]);

  const textCell = [];
  if (categoryLink) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = categoryLink.getAttribute('href');
    a.textContent = categoryLink.textContent.replace(/\s+/g, ' ').trim();
    p.append(a);
    textCell.push(p);
  }
  if (heading) {
    const h1 = document.createElement('h1');
    h1.innerHTML = heading.innerHTML;
    textCell.push(h1);
  }
  if (skillText) {
    const p = document.createElement('p');
    p.textContent = skillText;
    textCell.push(p);
  }
  cells.push([textCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-recipe', cells });
  element.replaceWith(block);
  // Intro copy follows the block as default content in the same section.
  if (descContent.length) block.after(...descContent);
}
