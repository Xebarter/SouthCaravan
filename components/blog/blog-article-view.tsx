'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  Eye,
  Heart,
  Home,
  LinkIcon,
  Linkedin,
  List,
  MessageSquare,
  Share2,
  Tag,
  Twitter,
  CheckCircle,
} from 'lucide-react';
import type { BlogPost, BlogComment } from '@/lib/types';
import {
  ARTICLE_PROSE_CLASS,
  formatBlogDate,
  prepareArticleContent,
  type ArticleHeading,
} from '@/lib/blog-article';

function getOrCreateSessionId(): string {
  const key = 'sc_blog_session';
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, id);
  }
  return id;
}

function CommentItem({ comment }: { comment: BlogComment }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
        {comment.author_name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-2 mb-1.5">
          <span className="text-sm font-semibold">{comment.author_name}</span>
          <span className="text-xs text-muted-foreground">{formatBlogDate(comment.created_at)}</span>
        </div>
        <p className="text-sm text-foreground/85 leading-relaxed">{comment.content}</p>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4 pl-4 border-l-2 border-primary/20">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentForm({ postId, onSubmitted }: { postId: string; onSubmitted: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/blog/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, author_name: name, author_email: email, content }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess(true);
      setName('');
      setEmail('');
      setContent('');
      onSubmitted();
    } else {
      setError(data.error ?? 'Failed to submit comment.');
    }
    setSubmitting(false);
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        <CheckCircle className="w-4 h-4 shrink-0" />
        Your comment has been submitted and is awaiting moderation.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="comment_name">Name *</Label>
          <Input id="comment_name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="comment_email">Email (optional)</Label>
          <Input id="comment_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
        </div>
      </div>
      <div>
        <Label htmlFor="comment_content">Comment *</Label>
        <Textarea
          id="comment_content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
          className="mt-1.5 resize-y"
          maxLength={2000}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={submitting || !name.trim() || !content.trim()}>
        {submitting ? 'Submitting…' : 'Post comment'}
      </Button>
    </form>
  );
}

function ArticleSidebar({
  headings,
  liked,
  likeCount,
  onLike,
  onShare,
  copied,
  authorName,
}: {
  headings: ArticleHeading[];
  liked: boolean;
  likeCount: number;
  onLike: () => void;
  onShare: (p: 'twitter' | 'linkedin' | 'copy') => void;
  copied: boolean;
  authorName: string;
}) {
  return (
    <aside className="hidden xl:block w-64 shrink-0">
      <div className="sticky top-24 space-y-5">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Share</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onLike}
              className={`flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                liked ? 'bg-red-50 border-red-200 text-red-600' : 'border-border hover:border-red-200 hover:text-red-600'
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-red-500' : ''}`} />
              {likeCount} {likeCount === 1 ? 'like' : 'likes'}
            </button>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onShare('twitter')}
                className="h-9 rounded-lg border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                aria-label="Share on X"
              >
                <Twitter className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onShare('linkedin')}
                className="h-9 rounded-lg border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                aria-label="Share on LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onShare('copy')}
                className="h-9 rounded-lg border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                aria-label="Copy link"
              >
                <LinkIcon className="h-4 w-4" />
              </button>
            </div>
            {copied && <p className="text-[11px] text-center text-primary font-medium">Link copied!</p>}
          </div>
        </div>

        {headings.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm max-h-[min(50vh,400px)] overflow-y-auto">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <List className="h-3.5 w-3.5" />
              In this article
            </p>
            <nav className="space-y-1">
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className={`block text-sm text-muted-foreground hover:text-primary transition-colors py-1 leading-snug ${
                    h.level === 3 ? 'pl-3 text-xs' : 'font-medium'
                  }`}
                >
                  {h.text}
                </a>
              ))}
            </nav>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Author</p>
          <p className="font-semibold text-foreground">{authorName}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">South Caravan editorial</p>
        </div>
      </div>
    </aside>
  );
}

function RelatedPostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300"
    >
      <div className="h-44 overflow-hidden bg-muted">
        {post.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image}
            alt={post.cover_image_alt ?? post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/10 to-sky-500/10">
            <BookOpen className="w-10 h-10 text-primary/30" />
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1 gap-2">
        {post.category && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit"
            style={{ backgroundColor: `${post.category.color}18`, color: post.category.color }}
          >
            {post.category.name}
          </span>
        )}
        <h3 className="font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2">
          {post.read_time_mins && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.read_time_mins} min
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-primary font-semibold group-hover:gap-2 transition-all">
            Read <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export type BlogArticleViewProps = {
  post: BlogPost;
  related?: BlogPost[];
  isPreview?: boolean;
};

export function BlogArticleView({ post, related = [], isPreview = false }: BlogArticleViewProps) {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [copied, setCopied] = useState(false);

  const { html: preparedContent, headings } = useMemo(
    () => prepareArticleContent(post.content),
    [post.content],
  );

  useEffect(() => {
    async function loadComments() {
      const res = await fetch(`/api/blog/comments?post_id=${post.id}`);
      const data = await res.json();
      setComments(data.comments ?? []);
    }
    loadComments();
  }, [post.id]);

  async function handleLike() {
    const res = await fetch('/api/blog/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id, session_id: getOrCreateSessionId() }),
    });
    const data = await res.json();
    if (res.ok) {
      setLiked(data.reacted);
      setLikeCount(data.like_count);
    }
  }

  function handleShare(platform: 'twitter' | 'linkedin' | 'copy') {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = post.title;
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <div className="bg-background min-h-screen">
      {isPreview && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-center text-sm py-2.5 px-4 font-medium">
          Preview — {post.status === 'published' ? 'visible when published' : 'draft only visible to admins'}
        </div>
      )}

      {/* Hero */}
      <header className="relative overflow-hidden">
        {post.cover_image ? (
          <div className="relative h-[min(52vh,420px)] w-full bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover_image}
              alt={post.cover_image_alt ?? post.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.55) 45%, rgba(15,23,42,0.25) 100%)',
              }}
            />
          </div>
        ) : (
          <div
            className="h-[min(40vh,320px)] w-full"
            style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f4c34 100%)' }}
          />
        )}

        <div className="absolute inset-x-0 bottom-0 z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-12 sm:pt-16">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-white/60 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors inline-flex items-center gap-1">
              <Home className="h-3 w-3" />
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
            {post.category && (
              <>
                <ChevronRight className="h-3 w-3" />
                <Link href={`/blog?category=${post.category.slug}`} className="hover:text-white transition-colors">
                  {post.category.name}
                </Link>
              </>
            )}
          </nav>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {post.category && (
              <Link href={`/blog?category=${post.category.slug}`}>
                <span
                  className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/20 bg-white/10 text-white"
                >
                  {post.category.name}
                </span>
              </Link>
            )}
            {post.featured && (
              <span className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-400/90 text-amber-950">
                Featured
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.12] tracking-tight max-w-4xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-4 text-lg sm:text-xl text-white/80 leading-relaxed max-w-3xl">{post.excerpt}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/70">
            <div className="flex items-center gap-2">
              {post.author_avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.author_avatar} alt="" className="w-9 h-9 rounded-full border-2 border-white/30 object-cover" />
              ) : (
                <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white font-bold text-sm border border-white/20">
                  {post.author_name.charAt(0)}
                </span>
              )}
              <span className="font-medium text-white">{post.author_name}</span>
            </div>
            {post.published_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatBlogDate(post.published_at)}
              </span>
            )}
            {post.read_time_mins && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.read_time_mins} min read
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {post.view_count.toLocaleString()} views
            </span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
          <svg viewBox="0 0 1440 40" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 40H1440V20C1200 0 960 40 720 20C480 0 240 40 0 20V40Z" className="fill-background" />
          </svg>
        </div>
      </header>

      {/* Article body + sidebar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="flex gap-10 xl:gap-12">
          <ArticleSidebar
            headings={headings}
            liked={liked}
            likeCount={likeCount}
            onLike={handleLike}
            onShare={handleShare}
            copied={copied}
            authorName={post.author_name}
          />

          <article className="flex-1 min-w-0">
            <div className="xl:hidden flex flex-wrap items-center justify-between gap-3 mb-8 pb-6 border-b border-border">
              <button
                type="button"
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${
                  liked ? 'bg-red-50 border-red-200 text-red-600' : 'border-border'
                }`}
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-red-500' : ''}`} />
                {likeCount}
              </button>
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-muted-foreground" />
                <button type="button" onClick={() => handleShare('twitter')} className="p-2 rounded-lg border border-border hover:text-primary">
                  <Twitter className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => handleShare('linkedin')} className="p-2 rounded-lg border border-border hover:text-primary">
                  <Linkedin className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => handleShare('copy')} className="text-xs px-3 py-2 rounded-lg border border-border">
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              </div>
            </div>

            <div className={ARTICLE_PROSE_CLASS} dangerouslySetInnerHTML={{ __html: preparedContent }} />

            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Topics</p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="text-xs gap-1 px-3 py-1">
                      <Tag className="h-3 w-3" />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile TOC */}
            {headings.length > 0 && (
              <details className="xl:hidden mt-8 rounded-2xl border border-border bg-card p-4">
                <summary className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Table of contents
                </summary>
                <nav className="mt-3 space-y-1 border-t border-border pt-3">
                  {headings.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className={`block text-sm text-muted-foreground hover:text-primary py-1 ${h.level === 3 ? 'pl-3 text-xs' : ''}`}
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </details>
            )}
          </article>
        </div>
      </div>

      {/* Author */}
      <section className="border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-start gap-5 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            {post.author_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.author_avatar} alt={post.author_name} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold shrink-0">
                {post.author_name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">About the author</p>
              <p className="text-xl font-bold text-foreground mt-1">{post.author_name}</p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl">
                Contributing to the South Caravan blog with insights on B2B procurement, wholesale trade, supplier
                relationships, and digital commerce across Africa and global markets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comments */}
      {post.allow_comments && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Discussion</h2>
            <span className="text-sm text-muted-foreground">
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </span>
          </div>

          {comments.length > 0 && (
            <div className="space-y-6 mb-8">
              {comments.map((c) => (
                <CommentItem key={c.id} comment={c} />
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Leave a comment</h3>
            <CommentForm
              postId={post.id}
              onSubmitted={async () => {
                const res = await fetch(`/api/blog/comments?post_id=${post.id}`);
                const data = await res.json();
                setComments(data.comments ?? []);
              }}
            />
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-border bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">Keep reading</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">Related articles</h2>
              </div>
              <Button variant="outline" asChild className="hidden sm:inline-flex shrink-0">
                <Link href="/blog">
                  View all <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((rp) => (
                <RelatedPostCard key={rp.id} post={rp} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section
        className="border-t border-border"
        style={{ background: 'linear-gradient(135deg,#ecfdf5 0%,#eff6ff 100%)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 mb-2">South Caravan</p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">Ready to grow your trade network?</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Discover suppliers, post RFQs, and build trusted B2B relationships on Africa&apos;s wholesale marketplace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild>
              <Link href="/">Explore marketplace</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                More articles
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function BlogArticleSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="h-[min(45vh,360px)] bg-muted" />
      <div className="max-w-6xl mx-auto px-4 py-14 space-y-6">
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-12 bg-muted rounded w-full max-w-3xl" />
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="space-y-3 mt-10">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded" style={{ width: `${85 - i * 5}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
