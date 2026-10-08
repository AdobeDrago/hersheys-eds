let tabsId = 0;

export default function decorate(block) {
  tabsId += 1;
  const id = `tabs-${tabsId}`;
  const list = document.createElement('div');
  list.className = 'tabs-list';
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-label', block.closest('.section')?.querySelector('h2')?.textContent || 'Content categories');
  const tabs = [];
  const panels = [];
  [...block.children].forEach((row, index) => {
    const [label, ...cells] = [...row.children];
    if (!label?.textContent.trim() || !cells.length) {
      // eslint-disable-next-line no-console
      console.error('Tabs row needs a label and content cell', row);
      return;
    }
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.id = `${id}-tab-${index}`;
    tab.textContent = label.textContent.trim();
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `${id}-panel-${index}`);
    const panel = document.createElement('div');
    panel.className = 'tabs-panel';
    panel.id = `${id}-panel-${index}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    const content = document.createElement('div');
    content.className = 'tabs-panel-content';
    cells.forEach((cell) => content.append(...cell.childNodes));
    const picture = content.querySelector('picture');
    if (picture) panel.append(picture);
    panel.append(content);
    row.replaceWith(panel);
    list.append(tab);
    tabs.push(tab);
    panels.push(panel);
  });
  if (!tabs.length) return;
  const select = (index, focus = false) => {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) {
      tabs[index].focus();
      tabs[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', (event) => {
      const destinations = {
        ArrowLeft: (index + tabs.length - 1) % tabs.length,
        ArrowRight: (index + 1) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      };
      if (event.key in destinations) {
        event.preventDefault();
        select(destinations[event.key], true);
      }
    });
  });
  block.prepend(list);
  select(0);
}
