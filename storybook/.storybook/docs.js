import { createElement, Fragment } from 'react';
import {
  Controls, Description, Primary, Stories, Subtitle, Title,
} from '@storybook/addon-docs/blocks';

export default function docsPage() {
  return createElement(
    Fragment,
    null,
    createElement(Title),
    createElement(Subtitle),
    createElement(Description),
    createElement(Primary),
    createElement(Controls),
    createElement(Stories, { includePrimary: false }),
  );
}
