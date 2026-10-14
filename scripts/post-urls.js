const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// The scaffold stores this slug as a permalink once, at article creation.
hexo.extend.filter.register('new_post_path', data => {
  if (['post', 'draft'].includes(data.layout) && !slugPattern.test(data.slug)) {
    throw new Error('Use an English slug: npx hexo new "中文标题" --slug my-post');
  }
  return data;
}, 1);

hexo.extend.filter.register('before_generate', () => {
  const paths = new Set();
  for (const post of hexo.locals.get('posts').toArray()) {
    const path = post.path.replace(/^\//, '');
    if (!path.endsWith('/') || !slugPattern.test(path.slice(0, -1))) {
      throw new Error(`${post.source}: set permalink to a short-english-name/`);
    }
    if (paths.has(path)) throw new Error(`Duplicate article permalink: ${path}`);
    paths.add(path);
  }
});
