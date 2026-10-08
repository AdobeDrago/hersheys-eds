import foundationStory from './stories.js';

export default {
  title: 'Foundations/Overview',
  parameters: {
    docs: { description: { component: 'A visual workspace for reviewing the design together: color, typography and action states. Start here, use your own copy, compare themes and explore variations with Controls.' } },
  },
};
export const DesignWorkspace = { ...foundationStory('overview'), name: 'Design Workspace' };
