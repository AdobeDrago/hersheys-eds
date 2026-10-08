import {
  explorationControls, workspaceArgs, workspaceControls,
} from '../design-system.js';
import renderGallery from './gallery.js';

export default function foundationStory(category, name) {
  const args = {
    ...workspaceArgs,
    text: 'Make life a little sweeter',
    copy: 'Discover something worth sharing. A little sweetness makes an ordinary moment memorable.',
  };
  const argTypes = {
    ...workspaceControls,
    text: explorationControls.text,
    copy: explorationControls.copy,
  };
  if (['overview', 'family', 'size', 'weight', 'lineHeight', 'tracking'].includes(category)) {
    Object.assign(args, {
      typeScale: 100, typeViewport: 'Desktop', leading: 'Designed', tracking: 0, alignment: 'left',
    });
    Object.assign(argTypes, {
      typeScale: {
        name: 'Type size · %',
        control: {
          type: 'range', min: 75, max: 150, step: 5,
        },
        description: 'Scale the samples together to explore hierarchy without editing the design.',
      },
      typeViewport: {
        name: 'Type scale', control: 'inline-radio', options: ['Mobile', 'Desktop'], description: 'Compare the designed mobile and desktop heading sizes.',
      },
      leading: { name: 'Line spacing', control: 'select', options: ['Designed', 'Compact', 'Comfortable', 'Relaxed'] },
      tracking: {
        name: 'Letter spacing · px',
        control: {
          type: 'range', min: -1, max: 2, step: 0.1,
        },
      },
      alignment: { name: 'Text alignment', control: 'inline-radio', options: ['left', 'center', 'right'] },
    });
  }
  if (['overview', 'interactive', 'surface'].includes(category)) {
    Object.assign(args, { actionLabel: 'Explore favorites', actionColor: '', actionTextColor: '' });
    Object.assign(argTypes, {
      actionLabel: { name: 'Action label', control: 'text' },
      actionColor: explorationControls.actionColor,
      actionTextColor: explorationControls.actionTextColor,
    });
  }
  if (['spacing', 'gaps'].includes(category)) {
    args.spacingScale = 100;
    argTypes.spacingScale = {
      name: 'Spacing · %',
      control: {
        type: 'range', min: 50, max: 150, step: 5,
      },
      description: 'Explore denser or more spacious arrangements side by side.',
    };
  }
  if (['duration', 'delay', 'easing'].includes(category)) {
    args.motionScale = 100;
    argTypes.motionScale = {
      name: 'Playback duration · %',
      control: {
        type: 'range', min: 50, max: 200, step: 10,
      },
    };
  }
  if (category === 'radius') {
    argTypes.rounding = {
      name: 'Try corner rounding · px',
      control: {
        type: 'range', min: 0, max: 50, step: 2,
      },
      description: 'Apply a candidate rounding to compare the shapes. Reset to restore each designed shape.',
    };
  }
  if (category === 'width') {
    argTypes.strokeWidth = {
      name: 'Try stroke width · px',
      control: {
        type: 'range', min: 1, max: 6, step: 1,
      },
    };
  }
  if (category === 'style') {
    args.borderStyle = 'Designed';
    argTypes.borderStyle = { name: 'Try a border treatment', control: 'inline-radio', options: ['Designed', 'solid', 'dashed', 'dotted', 'double'] };
  }
  if (category === 'layout') {
    args.widthScale = 100;
    argTypes.widthScale = {
      name: 'Content width · %',
      control: {
        type: 'range', min: 50, max: 125, step: 5,
      },
    };
  }
  if (['brand', 'neutral'].includes(category)) {
    args.candidateColor = '';
    argTypes.candidateColor = { name: 'Compare a candidate color', control: 'color', description: 'Add a trial swatch beside the designed palette. Reset to remove it.' };
  }
  const textCategories = ['overview', 'surface', 'text', 'family', 'size', 'weight', 'tracking', 'spacing', 'layout', 'shadow'];
  const copyCategories = ['overview', 'surface', 'border', 'lineHeight', 'layout', 'shadow'];
  if (!textCategories.includes(category)) {
    delete args.text;
    delete argTypes.text;
  }
  if (!copyCategories.includes(category)) {
    delete args.copy;
    delete argTypes.copy;
  }
  if (!['overview', 'size'].includes(category)) {
    delete args.typeViewport;
    delete argTypes.typeViewport;
  }
  if (!['overview', 'size', 'tracking'].includes(category)) {
    delete args.leading;
    delete argTypes.leading;
  }
  return {
    name,
    args,
    argTypes,
    render: (values) => renderGallery(category, values),
    parameters: {
      docs: { description: { story: 'Compare the treatments side by side. Use Controls to try your own copy, surfaces and visual variations; use the toolbar for theme and viewport comparisons. Experiments affect only this preview. Reset Controls to return to the designed defaults.' } },
    },
  };
}
