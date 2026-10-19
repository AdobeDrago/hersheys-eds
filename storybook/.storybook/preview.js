import '../../design/tokens.css';
import '../../design/themes/cocoa.css';
import '../../styles/hershey-home.css';
import '../../scripts/aem.js';
import { DecoratorHelpers } from '@storybook/addon-themes';
import { applyTheme, themes } from './theme.js';
import docsPage from './docs.js';
import '../foundations/foundations.css';
import '../markup/markup.css';
import '../foundations/design-workspace.css';

DecoratorHelpers.initializeThemeState(Object.keys(themes), 'Hersheyland');
window.hlx.codeBasePath = '';

export default {
  tags: ['autodocs'],
  decorators: [(story, context) => {
    const root = story();
    applyTheme(root, context.parameters.themes?.themeOverride || context.globals.theme || 'Hersheyland');
    return root;
  }],
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    viewport: {
      options: {
        mobile: { name: 'Mobile · 375px', styles: { width: '375px', height: '812px' }, type: 'mobile' },
        tablet: { name: 'Tablet · 768px', styles: { width: '768px', height: '1024px' }, type: 'tablet' },
        desktop: { name: 'Desktop · 1440px', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
      },
    },
    a11y: { context: '[data-showcase]', test: 'error' },
    docs: {
      page: docsPage,
      description: {
        component: 'Compare the design, explore variations with Controls, and use the toolbar to review themes and responsive viewports. Changes affect only the preview. Actions and Accessibility support interaction and contrast checks.',
      },
    },
    options: {
      storySort: {
        order: [
          'Foundations', [
            'Overview',
            'Color',
            'Typography',
            'Spacing & Layout',
            'Shape & Border',
            'Depth & Elevation',
            'Motion & Animation',
          ],
          'Default Content', [
            'Overview',
            'Heading 1', 'Heading 2', 'Heading 3', 'Heading 4', 'Heading 5', 'Heading 6',
            'Paragraph', 'Strong', 'Emphasis', 'Citation', 'Link', 'Buttons',
            'Unordered List', 'Ordered List', 'Blockquote', 'Image', 'Table', 'Divider',
          ],
          'Blocks', [
            'Cards', 'Columns', 'Hero', 'Tabs', 'Widget Loader',
            'Page Structure', ['Header', 'Footer', 'Fragment'],
          ],
          'Widgets',
        ],
      },
    },
  },
};
