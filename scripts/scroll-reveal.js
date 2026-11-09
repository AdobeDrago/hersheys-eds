/*
 * Scroll reveal, as on hersheyland.com: the homepage's feature bands (Columns (feature)) fade up when
 * they scroll into view. Headings take 0.5s, copy and buttons 0.8s, and the photos of the maroon and
 * chocolate bands 1s. The styles are in styles/hershey-home.css. Nothing is hidden for visitors who
 * prefer reduced motion.
 */
const TARGETS = [
  ['.columns.feature h2', 'reveal-heading'],
  ['.columns.feature p', 'reveal-copy'],
  ['.maroon .columns.feature picture, .chocolate .columns.feature picture', 'reveal-photo'],
];

/**
 * @param {Element} main The main element
 */
export default function revealOnScroll(main) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.filter((entry) => entry.isIntersecting).forEach(({ target }) => {
      target.classList.add('revealed');
      observer.unobserve(target);
    });
  }, { threshold: 0.15 });

  TARGETS.forEach(([selector, className]) => {
    main.querySelectorAll(selector).forEach((el) => {
      el.classList.add('reveal', className);
      observer.observe(el);
    });
  });
}
