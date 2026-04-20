'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Eye, MoreVertical, Pencil, Plus, Search, Star, StarOff,
  Trash2, Clock, MessageSquare, ThumbsUp, Tag, BookOpen,
} from 'lucide-react';
import type { BlogPost } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-500/10 text-green-600 border-green-200',
  draft: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
  archived: 'bg-gray-500/10 text-gray-500 border-gray-200',
  scheduled: 'bg-blue-500/10 text-blue-600 border-blue-200',
};

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const limit = 20;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);
    try {
      const res = await fetch(`/api/admin/blog?${params}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  async function toggleFeatured(post: BlogPost) {
    setActionLoading(post.id);
    await fetch('/api/admin/blog', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id, featured: !post.featured }),
    });
    await fetchPosts();
    setActionLoading(null);
  }

  async function toggleStatus(post: BlogPost) {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    setActionLoading(post.id);
    await fetch('/api/admin/blog', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id, status: newStatus }),
    });
    await fetchPosts();
    setActionLoading(null);
  }

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/admin/blog?id=${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    await fetchPosts();
  }

  const totalPages = Math.ceil(total / limit);
  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    drafts: posts.filter((p) => p.status === 'draft').length,
    featured: posts.filter((p) => p.featured).length,
  };

  return (
    <main>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
            <p className="text-muted-foreground mt-1">Create, edit, and manage all blog posts</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/blog/categories">Manage Categories</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/blog/new">
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Posts', value: total, icon: BookOpen, color: 'text-blue-600' },
            { label: 'Published', value: stats.published, icon: Eye, color: 'text-green-600' },
            { label: 'Drafts', value: stats.drafts, icon: Clock, color: 'text-yellow-600' },
            { label: 'Featured', value: stats.featured, icon: Star, color: 'text-amber-500' },
          ].map((s) => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                  <s.icon className={`w-5 h-5 ${s.color} opacity-70`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Posts table */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Posts</CardTitle>
            <CardDescription>{total} total</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                Loading posts…
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <BookOpen className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No posts found.</p>
                <Button asChild size="sm">
                  <Link href="/admin/blog/new">Create your first post</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors"
                  >
                    {/* Cover thumbnail */}
                    <div className="shrink-0 hidden sm:block">
                      {post.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.cover_image}
                          alt={post.cover_image_alt ?? post.title}
                          className="w-16 h-12 rounded-md object-cover border border-border"
                        />
                      ) : (
                        <div className="w-16 h-12 rounded-md bg-muted flex items-center justify-center border border-border">
                          <BookOpen className="w-5 h-5 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[post.status] ?? ''}`}
                        >
                          {post.status}
                        </span>
                        {post.featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                            <Star className="w-2.5 h-2.5 fill-amber-500" /> Featured
                          </span>
                        )}
                        {post.category && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border"
                            style={{ borderColor: `${post.category.color}40`, backgroundColor: `${post.category.color}15`, color: post.category.color }}
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {post.category.name}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-1">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{post.excerpt}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                        <span>By {post.author_name}</span>
                        <span>{formatDate(post.published_at ?? post.created_at)}</span>
                        {post.read_time_mins && <span>{post.read_time_mins} min read</span>}
                        <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{post.view_count}</span>
                        <span className="flex items-center gap-0.5"><ThumbsUp className="w-3 h-3" />{post.like_count}</span>
                        <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />{post.comment_count}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        title={post.featured ? 'Remove from featured' : 'Mark as featured'}
                        disabled={actionLoading === post.id}
                        onClick={() => toggleFeatured(post)}
                        className="h-8 w-8 p-0"
                      >
                        {post.featured
                          ? <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          : <StarOff className="w-3.5 h-3.5" />}
                      </Button>

                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                        <Link href={`/blog/${post.slug}`} target="_blank" title="View live post">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </Button>

                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                        <Link href={`/admin/blog/${post.id}/edit`} title="Edit post">
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/admin/blog/${post.id}/edit`)}>
                            <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(post)}>
                            {post.status === 'published' ? 'Unpublish' : 'Publish'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleFeatured(post)}>
                            {post.featured ? 'Remove featured' : 'Mark featured'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteId(post.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the post, its tags, comments, and cover image. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
