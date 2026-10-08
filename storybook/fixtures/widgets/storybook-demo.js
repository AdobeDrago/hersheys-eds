export default function decorate(widget) {
  widget.querySelector('h2').textContent = widget.dataset.heading;
  widget.querySelector('button').addEventListener('click', () => {
    widget.querySelector('[role="status"]').textContent = 'The mock widget is ready.';
  });
  widget.querySelector('[data-widget-fixture]').dataset.widgetReady = '';
}
