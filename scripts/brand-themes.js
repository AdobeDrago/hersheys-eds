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
  { label: "REESE'S", value: 'reeses-primary', file: 'brands' },
  { label: 'HERSHEY\'S', value: 'hersheys-brand-primary', file: 'brands' },
  { label: 'REESE\'S OREO CUPS', value: 'oreo-cup-primary', file: 'brands' },
  { label: 'HERSHEY\'S KISSES', value: 'kisses-primary', file: 'brands' },
  { label: 'KIT KAT', value: 'kit-kat-primary', file: 'brands' },
  { label: 'PAYDAY', value: 'payday-brand-primary', file: 'brands' },
  { label: 'ALMOND JOY & MOUNDS', value: 'almond-joy-mounds-primary', file: 'brands' },
  { label: 'MOUNDS', value: 'mounds-primary', file: 'brands' },
  {
    label: 'SOUR STRIPS',
    value: 'sour-strips-primary',
    file: 'brands',
    // headings are RusticoFarmero, a licensed fonts.net face: the kit loads as on hersheyland.com
    fontKit: 'https://cdn.fonts.net/kit/9f2e5c9e-d220-4715-a3c0-bf3f497817e4/'
      + '9f2e5c9e-d220-4715-a3c0-bf3f497817e4.css',
  },
  { label: 'ROLO', value: 'rolo-brand-primary', file: 'brands' },
  { label: 'CADBURY', value: 'cadbury-brand-primary', file: 'brands' },
  { label: 'BUBBLE YUM', value: 'bubbleyum-primary', file: 'brands' },
  { label: 'ICE BREAKERS', value: 'ice-breakers-primary', file: 'brands' },
  { label: 'JOLLY RANCHER', value: 'jolly-rancher-primary', file: 'brands' },
  { label: 'PIRATE\'S BOOTY', value: 'pirates-booty-primary', file: 'brands' },
  { label: 'SHAQ-A-LICIOUS', value: 'shaqalicious-primary', file: 'brands' },
  { label: 'TWIZZLERS', value: 'twizzlers-primary', file: 'brands' },
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
  { label: 'CHOCOLATE', value: 'chocolate-primary', file: 'brands' },
  { label: 'SWEETS', value: 'sweets-primary', file: 'brands' },
  { label: 'SNACKS', value: 'snacks-primary', file: 'brands' },
  { label: 'ZERO SUGAR', value: 'zero-sugar-primary', file: 'brands' },
  { label: 'ALL BRANDS', value: 'all-brands-primary', file: 'brands' },
];
