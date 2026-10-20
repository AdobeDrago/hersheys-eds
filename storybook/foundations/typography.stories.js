import foundationStory from './stories.js';

export default { title: 'Foundations/Typography' };
export const Families = { ...foundationStory('family'), name: 'Typefaces' };
export const Sizes = { ...foundationStory('size'), name: 'Type Scale' };
export const LineHeights = { ...foundationStory('lineHeight'), name: 'Reading Rhythm' };
export const Weights = { ...foundationStory('weight'), name: 'Weight Comparison' };
export const LetterSpacing = { ...foundationStory('tracking'), name: 'Tracking Comparison' };
