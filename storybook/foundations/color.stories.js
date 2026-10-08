import foundationStory from './stories.js';

export default { title: 'Foundations/Color' };
export const Brand = { ...foundationStory('brand'), name: 'Brand Palette' };
export const Neutral = { ...foundationStory('neutral'), name: 'Observed Neutral Values' };
export const Surface = { ...foundationStory('surface'), name: 'Surfaces in Use' };
export const Text = { ...foundationStory('text'), name: 'Text & Links' };
export const Interactive = { ...foundationStory('interactive'), name: 'Action & Selection States' };
export const Borders = { ...foundationStory('border'), name: 'Border Colors' };
export const Feedback = { ...foundationStory('feedback'), name: 'Validation Error' };
