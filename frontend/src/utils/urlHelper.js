// Utility to safely slugify category or subcategory names for URLs
export function slugifyCategory(cat) {
  if (!cat || typeof cat !== 'string') return '';
  return cat
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Generate the canonical hierarchical blog URL:
// - If both category & sub_category: /blog/{category}/{sub-category}/{slug}
// - If only category: /blog/{category}/{slug}
// - Fallback / raw slug: /blog/{slug}
export function getBlogUrl(blog) {
  if (!blog) return '/';

  // If a raw string is passed (legacy slug or slug string)
  if (typeof blog === 'string') {
    if (blog.startsWith('/blog/')) return blog;
    return `/blog/${blog}`;
  }

  const slug = blog.slug;
  if (!slug) return '/';

  const category = blog.category;
  const subCategory = blog.sub_category || blog.subcategory;

  const categorySlug = slugifyCategory(category);
  const subCategorySlug = slugifyCategory(subCategory);

  if (categorySlug && subCategorySlug) {
    return `/blog/${categorySlug}/${subCategorySlug}/${slug}`;
  } else if (categorySlug) {
    return `/blog/${categorySlug}/${slug}`;
  }

  return `/blog/${slug}`;
}
