// Product and brand page themes, set with `theme` page metadata. Shared by scripts.js and
// the DA Themes panel (tools/theme-picker). No imports: the panel runs outside the site.

// `colors` are the swatches the DA Themes panel shows (band, accent, action), copied from each
// theme's CSS: update them when a theme's colours change.

// base Hershey look, loaded for every /products/ page; has no file in design/themes
export const DEFAULT_THEME = {
  label: "Hershey's",
  value: 'hershey-primary',
  colors: ['#3f000b', '#feebd0', '#007bbd'],
};

// product page themes each have a design/themes/<value>.css; brand page themes (`file: 'brands'`)
// all live in design/themes/brands.css
export const BRAND_THEMES = [
  { label: "Reese's", value: 'reese-primary', colors: ['#ff5200', '#ff7d40', '#fe0'] },
  { label: 'Cadbury', value: 'cadbury-primary', colors: ['#40257c', '#705c9d', '#e30488'] },
  { label: 'Payday', value: 'payday-primary', colors: ['#ffc627', '#ffd45d', '#007bbd'] },
  { label: 'Rolo', value: 'rolo-primary', colors: ['#55281e', '#8d4f41', '#c0081c'] },
  // brand landing page themes (Hershey template pages, e.g. /brands/hersheys/symphony)
  {
    label: 'Symphony',
    value: 'symphony-primary',
    file: 'brands',
    colors: ['#feebd0', '#002f87', '#3c131c'],
  },
  {
    label: "Cookies 'N' Creme",
    value: 'cookies-n-creme-primary',
    file: 'brands',
    colors: ['#049fda', '#fff'],
  },
  {
    label: 'Mr. Goodbar',
    value: 'mrgoodbar-primary',
    file: 'brands',
    colors: ['#ffc627', '#c01615'],
  },
  {
    label: 'Creme Bars',
    value: 'creme-bars-primary',
    file: 'brands',
    colors: ['#e2cba6', '#feebd0'],
  },
  {
    label: 'YORK',
    value: 'york-primary',
    file: 'brands',
    colors: ['#a5a9ab', '#0033a0', '#bde6d1'],
  },
  {
    label: 'BROOKSIDE',
    value: 'brookside-primary',
    file: 'brands',
    colors: ['#e2d6c5', '#dbc9af', '#3f000b'],
  },
  {
    label: 'barkTHINS',
    value: 'barkthins-primary',
    file: 'brands',
    colors: ['#feebd0', '#3f000b'],
  },
  {
    label: '5TH AVENUE',
    value: 'fifth-avenue-primary',
    file: 'brands',
    colors: ['#3c131c', '#ffc627'],
  },
  {
    label: 'BREATH SAVERS',
    value: 'breath-savers-primary',
    file: 'brands',
    colors: ['#003594', '#4068af'],
  },
  {
    label: 'GOOD & PLENTY',
    value: 'good-and-plenty-primary',
    file: 'brands',
    colors: ['#e0baf1', '#bc8dd7', '#db1392'],
  },
  {
    label: 'HEATH', value: 'heath-primary', file: 'brands', colors: ['#ea7f25', '#f9d7a7'],
  },
  {
    label: 'WHATCHAMACALLIT',
    value: 'whatchamacallit-primary',
    file: 'brands',
    colors: ['#ffc627', '#ffd45d', '#3f000b'],
  },
  {
    label: 'WHOPPERS',
    value: 'whoppers-primary',
    file: 'brands',
    colors: ['#f7e4bf', '#fff6e6', '#3f000b'],
  },
  {
    label: 'ZAGNUT', value: 'zagnut-primary', file: 'brands', colors: ['#d92632', '#f9e300'],
  },
  {
    label: 'SKOR', value: 'skor-primary', file: 'brands', colors: ['#3c131c', '#f47835'],
  },
  {
    label: 'SKINNYPOP',
    value: 'skinnypop-primary',
    file: 'brands',
    colors: ['#fff', '#002f6c', '#fff1bf'],
  },
  {
    label: 'MILK DUDS',
    value: 'milk-duds-primary',
    file: 'brands',
    colors: ['#ffc627', '#feebd0', '#3f000b'],
  },
  {
    label: "DOT'S HOMESTYLE PRETZELS",
    value: 'dots-pretzels-primary',
    file: 'brands',
    colors: ['#ca0b12', '#fff'],
  },
  {
    label: 'ZERO',
    value: 'zero-primary',
    file: 'brands',
    colors: ['#bfcce4', '#003594', '#00aeef'],
  },
];
