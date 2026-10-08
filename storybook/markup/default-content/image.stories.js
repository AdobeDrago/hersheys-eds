import contentMeta from './render.js';

export default { title: 'Default Content/Image', ...contentMeta('image') };
export const Default = {};
export const WithoutImage = { args: { showImage: false } };
