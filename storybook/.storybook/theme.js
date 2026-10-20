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
