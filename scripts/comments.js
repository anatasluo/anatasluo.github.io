const { readFileSync } = require('node:fs');
const { join } = require('node:path');

// Oranges does not check the per-page comments flag. Use a local config copy.
hexo.extend.filter.register('template_locals', locals => {
  if (locals.page.comments === false) {
    locals.theme = {
      ...locals.theme,
      comments: { ...locals.theme.comments, enable: false }
    };
  }
  return locals;
});

// Override only the comments partial, without editing the theme submodule.
hexo.extend.filter.register('before_generate', () => {
  const comments = hexo.theme.config.comments;
  if (!comments.enable || !comments.giscus.enable) return;

  const template = join(hexo.base_dir, 'layout/_partial/comments.ejs');
  hexo.theme.setView('_partial/comments.ejs', readFileSync(template, 'utf8'));
});
