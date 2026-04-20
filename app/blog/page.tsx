'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Clock, Eye, Calendar, ArrowRight, BookOpen, Rss } from 'lucide-react';
import type { BlogPost, BlogCategory } from '@/lib/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function PostCard({ post, featured }: { post: BlogPost; featured?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow ${featured ? 'md:flex-row' : ''}`}
    >
      {/* Cover */}
      <div className={`overflow-hidden bg-muted ${featured ? 'md:w-2/5 h-52 md:h-auto' : 'h-44'}`}>
        {post.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image}
            alt={post.cover_image_alt ?? post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/10 to-primary/5">
            <BookOpen className="w-10 h-10 text-primary/30" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {post.category && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${post.category.color}20`, color: post.category.color }}
            >
              {post.category.name}
            </span>
          )}
          {post.featured && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
              Featured
            </span>
          )}
        </div>

        <div>
          <h3 className={`font-bold text-foreground group-hover:text-primary transition-colors leading-snug ${featured ? 'text-xl' : 'text-base'}`}>
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-auto pt-2 border-t border-border">
          <span className="font-medium text-foreground/70">{post.author_name}</span>
          {post.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(post.published_at)}
            </span>
          )}
          {post.read_time_mins && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.read_time_mins} min
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {post.view_count.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [page, setPage] = useState(1);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '9' });
    if (search) params.set('search', search);
    if (activeCategory) params.set('category', activeCategory);
    try {
      const res = await fetch(`/api/blog?${params}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, search, activeCategory]);

  useEffect(() => {
    fetch('/api/admin/blog/categories').then((r) => r.json()).then((d) => setCategories(d.categories ?? []));
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const featuredPost = posts.find((p) => p.featured);
  const regularPosts = posts.filter((p) => !p.featured || posts.indexOf(p) > 0);

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 45%,#0f4c34 100%)' }}
      >
        <span aria-hidden className="pointer-events-none absolute -left-24 -top-24 w-96 h-96 rounded-full bg-white/3" />
        <span aria-hidden className="pointer-events-none absolute right-0 top-0 w-80 h-80 rounded-full bg-emerald-500/7" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/80 mb-5">
              <Rss className="w-3 h-3" /> SouthCaravan Blog
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Insights for<br />
              <span className="text-emerald-400">B2B Procurement</span>
            </h1>
            <p className="mt-4 text-lg text-white/70 leading-relaxed">
              Industry insights, platform updates, supplier stories, and procurement best practices for Africa&apos;s growing business community.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 40H1440V20C1200 0 960 40 720 20C480 0 240 40 0 20V40Z" className="fill-background" />
          </svg>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search articles…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setActiveCategory(''); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                activeCategory === ''
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary hover:text-primary'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => { setActiveCategory(cat.slug); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                  activeCategory === cat.slug
                    ? 'text-white border-transparent'
                    : 'border-border hover:border-primary hover:text-primary'
                }`}
                style={activeCategory === cat.slug ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-muted-foreground mb-6">
            {total === 0 ? 'No articles found.' : `${total} article${total !== 1 ? 's' : ''}`}
            {activeCategory && ` in ${categories.find((c) => c.slug === activeCategory)?.name}`}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
                <div className="h-44 bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <BookOpen className="w-12 h-12 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No articles found.</p>
            {(search || activeCategory) && (
              <Button variant="outline" size="sm" onClick={() => { setSearch(''); setActiveCategory(''); }}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featuredPost && page === 1 && !search && !activeCategory && (
              <div className="mb-8">
                <PostCard post={featuredPost} featured />
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(featuredPost && page === 1 && !search && !activeCategory ? regularPosts : posts).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Newsletter CTA */}
        <div
          className="mt-16 rounded-2xl overflow-hidden border border-emerald-200 px-8 sm:px-12 py-10 text-center relative"
          style={{ background: 'linear-gradient(135deg,#ecfdf5 0%,#eff6ff 100%)' }}
        >
          <p className="text-[11px] uppercase tracking-widest font-bold text-emerald-700 mb-3">Stay in the loop</p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
            Get the latest insights delivered
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Subscribe to the SouthCaravan blog for weekly procurement tips, market intelligence, and platform updates.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
            <Input placeholder="your@email.com" className="flex-1" />
            <Button>Subscribe</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
