const SCRIPTS = [
  '//cdn.pricespider.com/1/lib/ps-widget.js',
  '//cdn.pricespider.com/1/2366/ps-utid.js',
];
const [widgetSrc] = SCRIPTS;

/**
 * Where-to-buy widget. The SKU comes from the `ps-sku` query param (set by Shop Now)
 * and the PriceSpider config id from the authored widget link (`?config=`).
 * @param {Element} widget The widget block element
 */
export default function decorate(widget) {
  const target = widget.querySelector('.ps-widget');
  const sku = new URLSearchParams(window.location.search).get('ps-sku');
  if (sku) target.setAttribute('ps-sku', sku);
  if (widget.dataset.config) target.setAttribute('ps-config', widget.dataset.config);

  [['preload', 'script'], ['dns-prefetch'], ['preconnect']].forEach(([rel, as]) => {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = widgetSrc;
    if (as) link.as = as;
    if (rel === 'preconnect') link.crossOrigin = '';
    document.head.append(link);
  });

  SCRIPTS.forEach((src) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    document.head.append(script);
  });
}
