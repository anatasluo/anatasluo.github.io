const { createHash } = require('node:crypto');

// Short deterministic IDs for non-ASCII headings; English IDs stay readable.
const asciiId = id => /[^\x00-\x7F]/.test(id)
  ? 'section-' + createHash('sha256').update(id).digest('hex').slice(0, 12)
  : id;

hexo.extend.filter.register('marked:renderer', function(renderer) {
  const heading = renderer.heading;
  const link = renderer.link;
  const site = new URL(this.config.url);

  renderer.heading = function(text, level) {
    const html = heading.call(this, text, level);
    const match = html.match(/^<h[1-6] id="([^"]+)"/);
    if (!match) return html;
    const id = match[1];
    const anchor = asciiId(id);
    return html.replace(`id="${id}"`, `id="${anchor}"`)
      .replace(`href="#${id}"`, `href="#${anchor}"`);
  };

  // Preserve handwritten links to Chinese headings, including links across posts.
  renderer.link = function(href, title, text) {
    const url = new URL(href, site);
    if (url.origin === site.origin && url.hash) {
      const id = decodeURIComponent(url.hash.slice(1));
      href = href.split('#')[0] + '#' + asciiId(id);
    }
    return link.call(this, href, title, text);
  };
});
