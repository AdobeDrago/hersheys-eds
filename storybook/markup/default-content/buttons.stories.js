import contentMeta from './render.js';

export default { title: 'Default Content/Buttons', ...contentMeta('button') };
export const Primary = {};
export const Secondary = { args: { variant: 'secondary' } };
export const Accent = { args: { variant: 'accent' } };
