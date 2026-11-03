// Product and brand page themes, set with `theme` page metadata. Shared by scripts.js and
// the DA Themes panel (tools/theme-picker). No imports: the panel runs outside the site.

// base Hershey look, loaded for every /products/ page; has no file in design/themes
export const DEFAULT_THEME = { label: "Hershey's", value: 'hershey-primary' };

// product page themes each have a design/themes/<value>.css; brand page themes (`file: 'brands'`)
// all live in design/themes/brands.css
export const BRAND_THEMES = [
  { label: "Reese's", value: 'reese-primary' },
  { label: 'Cadbury', value: 'cadbury-primary' },
  { label: 'Payday', value: 'payday-primary' },
  { label: 'Rolo', value: 'rolo-primary' },
  // brand landing page themes (Hershey template pages, e.g. /brands/hersheys/symphony)
  { label: 'Symphony', value: 'symphony-primary', file: 'brands' },
  { label: "Cookies 'N' Creme", value: 'cookies-n-creme-primary', file: 'brands' },
  { label: 'Mr. Goodbar', value: 'mrgoodbar-primary', file: 'brands' },
  { label: 'Creme Bars', value: 'creme-bars-primary', file: 'brands' },
  { label: 'YORK', value: 'york-primary', file: 'brands' },
  { label: 'BROOKSIDE', value: 'brookside-primary', file: 'brands' },
  { label: 'barkTHINS', value: 'barkthins-primary', file: 'brands' },
  { label: '5TH AVENUE', value: 'fifth-avenue-primary', file: 'brands' },
  { label: 'BREATH SAVERS', value: 'breath-savers-primary', file: 'brands' },
  { label: 'GOOD & PLENTY', value: 'good-and-plenty-primary', file: 'brands' },
  { label: 'HEATH', value: 'heath-primary', file: 'brands' },
  { label: 'WHATCHAMACALLIT', value: 'whatchamacallit-primary', file: 'brands' },
  { label: 'WHOPPERS', value: 'whoppers-primary', file: 'brands' },
  { label: 'ZAGNUT', value: 'zagnut-primary', file: 'brands' },
  { label: 'SKOR', value: 'skor-primary', file: 'brands' },
  { label: 'SKINNYPOP', value: 'skinnypop-primary', file: 'brands' },
  { label: 'MILK DUDS', value: 'milk-duds-primary', file: 'brands' },
  { label: "DOT'S HOMESTYLE PRETZELS", value: 'dots-pretzels-primary', file: 'brands' },
  { label: 'ZERO', value: 'zero-primary', file: 'brands' },
];
