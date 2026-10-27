// Product page themes, set with `theme` page metadata. Shared by scripts.js and
// the DA Themes panel (tools/theme-picker). No imports: the panel runs outside the site.

// base Hershey look, loaded for every /products/ page; has no file in design/themes
export const DEFAULT_THEME = { label: "Hershey's", value: 'hershey-primary' };

// each value needs a matching design/themes/<value>.css
export const BRAND_THEMES = [
  { label: "Reese's", value: 'reese-primary' },
  { label: 'Cadbury', value: 'cadbury-primary' },
  { label: 'Payday', value: 'payday-primary' },
  { label: 'Rolo', value: 'rolo-primary' },
];
