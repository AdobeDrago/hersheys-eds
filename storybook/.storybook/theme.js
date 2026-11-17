import { BRAND_THEMES } from '../../scripts/brand-themes.js';

export const themes = {
  Hersheyland: 'theme-hersheyland',
  Cocoa: 'theme-cocoa-dark',
};

export function applyTheme(root, name) {
  if (!themes[name]) throw new Error(`Unknown showcase theme: ${name}`);
  const specimens = [
    ...(root.matches('[data-showcase]') ? [root] : []),
    ...root.querySelectorAll('[data-showcase]'),
  ];
  specimens.forEach((specimen) => {
    specimen.classList.remove(...Object.values(themes));
    specimen.classList.add(themes[name]);
  });
}

// Product and brand page themes: the same list the site and the DA Themes panel use.
// Product themes style `.hershey-product.<value>`, brand page themes `.hershey-home.<value>`
// (and need `hershey-brand`), so the specimen gets the matching page class as well.
export const brandItems = [
  { value: 'default', title: "Default (Hershey's)" },
  ...BRAND_THEMES.map(({ label, value, file }) => ({
    value,
    title: `${file === 'brands' ? 'Brand page' : 'Product'}: ${label}`,
  })),
];

export function applyBrand(root, value) {
  const specimens = [
    ...(root.matches('[data-showcase]') ? [root] : []),
    ...root.querySelectorAll('[data-showcase]'),
  ];
  specimens.forEach((specimen) => {
    specimen.classList.remove('hershey-product', ...BRAND_THEMES.map((t) => t.value));
    // stories that opt into hershey-brand themselves keep it when no brand theme is picked
    const theme = BRAND_THEMES.find((t) => t.value === value);
    if (!theme) return;
    specimen.classList.add(theme.value);
    if (theme.file === 'brands') specimen.classList.add('hershey-brand');
    else specimen.classList.add('hershey-product');
  });
}
