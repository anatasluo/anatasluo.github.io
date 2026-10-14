(() => {
  const container = document.querySelector('.giscus');
  const client = document.createElement('script');
  const root = document.documentElement;
  const theme = () => root.getAttribute('color-mode') === 'dark' ? 'dark' : 'light';

  Object.assign(client.dataset, container.dataset, { theme: theme() });
  client.src = 'https://giscus.app/client.js';
  client.crossOrigin = 'anonymous';
  client.async = true;

  const syncTheme = () => {
    client.dataset.theme = theme();
    const frame = container.querySelector('iframe');
    if (frame) {
      frame.contentWindow.postMessage({
        giscus: { setConfig: { theme: theme() } }
      }, 'https://giscus.app');
    }
  };

  // Also sync after a lazy iframe loads, if the mode changed while loading.
  container.addEventListener('load', syncTheme, true);
  new MutationObserver(syncTheme).observe(root, {
    attributes: true,
    attributeFilter: ['color-mode']
  });
  container.appendChild(client);
})();
