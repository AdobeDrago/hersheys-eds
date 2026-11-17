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
      storySort: (a, b) => {
        // Named titles first (nested arrays order their children), the rest A-Z.
        // Kept inline: Storybook only reads storySort when it is defined in this object.
        const titleOrder = [
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
            'Accordion', 'Banner', 'Breadcrumb Trail', 'Cards', 'Columns',
            'Details and Directions', 'Hero', 'Hersheys Search', 'Jump Links', 'Link Group',
            'Newsletter', 'Newsletter Signup',
            'Page Structure', ['Header', 'Footer', 'Fragment'],
            'Poll', 'Recipe Details', 'Social Share', 'Tabs', 'Timeline', 'Timeline Nav',
            'Widget Loader',
          ],
          'Widgets',
        ];
        const rankIn = (order, name) => {
          const i = order.indexOf(name);
          return i === -1 ? Infinity : i;
        };
        const compareTitles = (ta, tb) => {
          let order = titleOrder;
          const pa = ta.split('/');
          const pb = tb.split('/');
          for (let i = 0; i < Math.min(pa.length, pb.length); i += 1) {
            if (pa[i] !== pb[i]) {
              return rankIn(order, pa[i]) - rankIn(order, pb[i]) || pa[i].localeCompare(pb[i]);
            }
            const next = order[order.indexOf(pa[i]) + 1];
            order = Array.isArray(next) ? next : [];
          }
          return pa.length - pb.length;
        };
        // Within a component: Docs first, then Default, then stories A-Z.
        const storyRank = (entry) => {
          if (entry.type === 'docs') return 0;
          return entry.name.replace(/\s*⚡$/, '') === 'Default' ? 1 : 2;
        };
        if (a.title !== b.title) return compareTitles(a.title, b.title);
        return storyRank(a) - storyRank(b) || a.name.localeCompare(b.name);
      },
    },
  },
};
