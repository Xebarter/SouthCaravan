import { notFound, redirect } from 'next/navigation';

import { BlogArticleView } from '@/components/blog/blog-article-view';
import { requireAdmin } from '@/lib/admin-require';
import {
  getBlogPostFullBySlug,
  getPublishedBlogPostFullBySlug,
  getRelatedBlogPosts,
  recordBlogPostViewFromRequest,
} from '@/lib/blog-data';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export default async function BlogPostPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === '1';

  if (isPreview) {
    const auth = await requireAdmin();
    if (!auth.ok) redirect('/blog');

    const post = await getBlogPostFullBySlug(slug);
    if (!post) notFound();

    const related = await getRelatedBlogPosts(post.id, {
      categoryId: post.category_id,
      publishedOnly: false,
    });

    return <BlogArticleView post={post} related={related} isPreview />;
  }

  const post = await getPublishedBlogPostFullBySlug(slug);
  if (!post) notFound();

  const related = await getRelatedBlogPosts(post.id, {
    categoryId: post.category_id,
    publishedOnly: true,
  });

  recordBlogPostViewFromRequest(post.id);

  return <BlogArticleView post={post} related={related} />;
}
