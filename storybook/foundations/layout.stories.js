import foundationStory from './stories.js';

export default { title: 'Foundations/Spacing & Layout' };
export const Spacing = { ...foundationStory('spacing'), name: 'Content Insets' };
export const Grid = { ...foundationStory('layout'), name: 'Content Widths' };
export const Gaps = { ...foundationStory('gaps'), name: 'Space Between Elements' };
