'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  LinkIcon,
  Linkedin,
  List,
  MessageSquare,
  PenLine,
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

function ReadingProgressBar({ progress }: { progress: number }) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-border/30"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div
        className="h-full bg-primary transition-[width] duration-150 ease-out shadow-[0_0_8px_rgba(var(--primary),0.4)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function useReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return progress;
}

function useActiveHeading(headings: ArticleHeading[]) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);

  useEffect(() => {
    if (!headings.length) return;

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}

function CommentItem({ comment }: { comment: BlogComment }) {
  return (
    <article className="flex gap-4 rounded-xl border border-border/80 bg-card p-4 sm:p-5">
      <div className="shrink-0 w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
        {comment.author_name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <header className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-2">
          <span className="text-sm font-semibold text-foreground">{comment.author_name}</span>
          <time className="text-xs text-muted-foreground">{formatBlogDate(comment.created_at)}</time>
        </header>
        <p className="text-sm text-foreground/85 leading-relaxed">{comment.content}</p>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-5 space-y-4 pl-4 border-l-2 border-primary/25">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} />
            ))}
          </div>
        )}
      </div>
    </article>
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
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
        <CheckCircle className="w-4 h-4 shrink-0" />
        Thank you — your comment is awaiting moderation and will appear once approved.
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
        <Label htmlFor="comment_content">Your comment *</Label>
        <Textarea
          id="comment_content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
          className="mt-1.5 resize-y"
          maxLength={2000}
          placeholder="Share your perspective on this article…"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={submitting || !name.trim() || !content.trim()}>
        {submitting ? 'Submitting…' : 'Post comment'}
      </Button>
    </form>
  );
}

function ShareButtons({
  liked,
  likeCount,
  onLike,
  onShare,
  copied,
  layout = 'vertical',
}: {
  liked: boolean;
  likeCount: number;
  onLike: () => void;
  onShare: (p: 'twitter' | 'linkedin' | 'copy') => void;
  copied: boolean;
  layout?: 'vertical' | 'horizontal';
}) {
  const social = (
    <>
      <button
        type="button"
        onClick={() => onShare('twitter')}
        className="h-10 rounded-lg border border-border flex items-center justify-center hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors"
        aria-label="Share on X"
      >
        <Twitter className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onShare('linkedin')}
        className="h-10 rounded-lg border border-border flex items-center justify-center hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onShare('copy')}
        className="h-10 rounded-lg border border-border flex items-center justify-center hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors"
        aria-label="Copy link"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
    </>
  );

  if (layout === 'horizontal') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onLike}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
            liked ? 'bg-red-50 border-red-200 text-red-600' : 'border-border hover:border-red-200 hover:text-red-600'
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-red-500' : ''}`} />
          {likeCount}
        </button>
        <div className="flex items-center gap-2">{social}</div>
        {copied && <span className="text-xs font-medium text-primary">Link copied</span>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onLike}
        className={`flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
          liked ? 'bg-red-50 border-red-200 text-red-600' : 'border-border hover:border-red-200 hover:text-red-600'
        }`}
      >
        <Heart className={`h-4 w-4 ${liked ? 'fill-red-500' : ''}`} />
        {likeCount} {likeCount === 1 ? 'like' : 'likes'}
      </button>
      <div className="grid grid-cols-3 gap-2">{social}</div>
      {copied && <p className="text-[11px] text-center text-primary font-medium">Link copied</p>}
    </div>
  );
}

function TableOfContents({
  headings,
  activeId,
  className = '',
}: {
  headings: ArticleHeading[];
  activeId: string | null;
  className?: string;
}) {
  if (!headings.length) return null;

  return (
    <nav className={className} aria-label="Table of contents">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
        <List className="h-3.5 w-3.5" />
        On this page
      </p>
      <ul className="space-y-0.5">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block py-1.5 text-sm leading-snug border-l-2 pl-3 -ml-px transition-colors ${
                h.level === 3 ? 'text-xs pl-5' : 'font-medium'
              } ${
                activeId === h.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ArticleSidebar({
  headings,
  activeId,
  liked,
  likeCount,
  onLike,
  onShare,
  copied,
  authorName,
  authorAvatar,
}: {
  headings: ArticleHeading[];
  activeId: string | null;
  liked: boolean;
  likeCount: number;
  onLike: () => void;
  onShare: (p: 'twitter' | 'linkedin' | 'copy') => void;
  copied: boolean;
  authorName: string;
  authorAvatar?: string;
}) {
  return (
    <aside className="hidden xl:block w-[280px] shrink-0">
      <div className="sticky top-24 space-y-5">
        {headings.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm max-h-[min(42vh,360px)] overflow-y-auto">
            <TableOfContents headings={headings} activeId={activeId} />
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Share article</p>
          <ShareButtons liked={liked} likeCount={likeCount} onLike={onLike} onShare={onShare} copied={copied} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Written by</p>
          <div className="flex items-center gap-3">
            {authorAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={authorAvatar} alt="" className="w-11 h-11 rounded-xl object-cover" />
            ) : (
              <span className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                {authorName.charAt(0)}
              </span>
            )}
            <div>
              <p className="font-semibold text-foreground text-sm leading-tight">{authorName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">South Caravan</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function RelatedPostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      prefetch
      className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-primary/25 transition-all duration-300"
    >
      <div className="aspect-[16/10] overflow-hidden bg-muted relative">
        {post.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image}
            alt={post.cover_image_alt ?? post.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-sky-500/10">
            <BookOpen className="w-10 h-10 text-primary/25" />
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1 gap-2.5">
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
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">{post.excerpt}</p>
        )}
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary pt-1 group-hover:gap-2 transition-all">
          Read article <ArrowRight className="h-3.5 w-3.5" />
        </span>
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

  const readingProgress = useReadingProgress();

  const { html: preparedContent, headings } = useMemo(
    () => prepareArticleContent(post.content),
    [post.content],
  );

  const activeHeadingId = useActiveHeading(headings);

  const refreshComments = useCallback(async () => {
    const res = await fetch(`/api/blog/comments?post_id=${post.id}`);
    const data = await res.json();
    setComments(data.comments ?? []);
  }, [post.id]);

  useEffect(() => {
    refreshComments();
  }, [refreshComments]);

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

  const showUpdated =
    post.updated_at &&
    post.published_at &&
    new Date(post.updated_at).getTime() > new Date(post.published_at).getTime() + 86400000;

  return (
    <div className="bg-background min-h-screen">
      <ReadingProgressBar progress={readingProgress} />

      {isPreview && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-center text-sm py-2.5 px-4 font-medium relative z-50">
          Preview — {post.status === 'published' ? 'published view' : 'draft visible to admins only'}
        </div>
      )}

      {/* Hero */}
      <header className="relative overflow-hidden bg-slate-950">
        {post.cover_image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover_image}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/50 to-slate-950/95" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 45%,#0f4c34 100%)' }}
          />
        )}

        <div className="relative z-10 border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to blog
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-xs text-white/50">
              <PenLine className="h-3.5 w-3.5" />
              South Caravan Insights
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 sm:pb-20">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-white/50 mb-6" aria-label="Breadcrumb">
            <Link href="/blog" className="hover:text-white/90 transition-colors">
              Blog
            </Link>
            {post.category && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <Link href={`/blog?category=${post.category.slug}`} className="hover:text-white/90 transition-colors">
                  {post.category.name}
                </Link>
              </>
            )}
          </nav>

          <div className="flex flex-wrap items-center gap-2 mb-5">
            {post.category && (
              <Link href={`/blog?category=${post.category.slug}`}>
                <span
                  className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: `${post.category.color}30`,
                    color: post.category.color,
                    boxShadow: `inset 0 0 0 1px ${post.category.color}40`,
                  }}
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

          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-white leading-[1.1] tracking-tight text-balance">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-5 text-lg sm:text-xl text-white/75 leading-relaxed max-w-3xl text-pretty">{post.excerpt}</p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-5 py-4">
            <div className="flex items-center gap-3">
              {post.author_avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.author_avatar} alt="" className="w-10 h-10 rounded-full ring-2 ring-white/20 object-cover" />
              ) : (
                <span className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white font-bold ring-2 ring-white/20">
                  {post.author_name.charAt(0)}
                </span>
              )}
              <div>
                <p className="text-sm font-semibold text-white">{post.author_name}</p>
                <p className="text-xs text-white/50">Author</p>
              </div>
            </div>
            <span className="hidden sm:block w-px h-8 bg-white/15" aria-hidden />
            {post.published_at && (
              <span className="flex items-center gap-1.5 text-sm text-white/70">
                <Calendar className="h-4 w-4 text-white/40" />
                {formatBlogDate(post.published_at)}
              </span>
            )}
            {post.read_time_mins && (
              <span className="flex items-center gap-1.5 text-sm text-white/70">
                <Clock className="h-4 w-4 text-white/40" />
                {post.read_time_mins} min read
              </span>
            )}
            <span className="flex items-center gap-1.5 text-sm text-white/70">
              <Eye className="h-4 w-4 text-white/40" />
              {post.view_count.toLocaleString()} views
            </span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
          <svg viewBox="0 0 1440 48" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 48H1440V24C1200 4 960 48 720 24C480 0 240 48 0 24V48Z" className="fill-background" />
          </svg>
        </div>
      </header>

      {/* Article */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 pb-4">
        <div className="flex gap-10 xl:gap-14 items-start">
          <div className="flex-1 min-w-0 max-w-3xl xl:max-w-none mx-auto xl:mx-0">
            {/* Meta + mobile share */}
            <div className="xl:hidden mb-6 space-y-4">
              <ShareButtons
                layout="horizontal"
                liked={liked}
                likeCount={likeCount}
                onLike={handleLike}
                onShare={handleShare}
                copied={copied}
              />
              {headings.length > 0 && (
                <details className="rounded-2xl border border-border bg-card p-4 shadow-sm group">
                  <summary className="text-sm font-semibold cursor-pointer flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
                    <List className="h-4 w-4 text-primary" />
                    Table of contents
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="mt-4 pt-4 border-t border-border">
                    <TableOfContents headings={headings} activeId={activeHeadingId} />
                  </div>
                </details>
              )}
            </div>

            <article className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="px-6 sm:px-10 lg:px-12 pt-8 sm:pt-10 pb-2 border-b border-border/60 bg-muted/20">
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {post.published_at && (
                    <span>
                      <span className="font-semibold text-foreground/70">Published </span>
                      {formatBlogDate(post.published_at)}
                    </span>
                  )}
                  {showUpdated && (
                    <span>
                      <span className="font-semibold text-foreground/70">Updated </span>
                      {formatBlogDate(post.updated_at)}
                    </span>
                  )}
                </div>
              </div>

              <div className="px-6 sm:px-10 lg:px-12 py-8 sm:py-10 lg:py-12">
                <div className={ARTICLE_PROSE_CLASS} dangerouslySetInnerHTML={{ __html: preparedContent }} />
              </div>

              {post.tags && post.tags.length > 0 && (
                <footer className="px-6 sm:px-10 lg:px-12 py-6 sm:py-8 border-t border-border bg-muted/15">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Related topics</p>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="text-xs gap-1.5 px-3 py-1.5 font-medium">
                        <Tag className="h-3 w-3 opacity-70" />
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </footer>
              )}
            </article>

            {/* End of article share */}
            <div className="mt-8 hidden sm:flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-6 py-4 shadow-sm">
              <p className="text-sm font-medium text-foreground">Found this useful?</p>
              <ShareButtons
                layout="horizontal"
                liked={liked}
                likeCount={likeCount}
                onLike={handleLike}
                onShare={handleShare}
                copied={copied}
              />
            </div>
          </div>

          <ArticleSidebar
            headings={headings}
            activeId={activeHeadingId}
            liked={liked}
            likeCount={likeCount}
            onLike={handleLike}
            onShare={handleShare}
            copied={copied}
            authorName={post.author_name}
            authorAvatar={post.author_avatar}
          />
        </div>
      </div>

      {/* Author */}
      <section className="border-t border-border bg-muted/25 mt-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex gap-10 xl:gap-14">
            <div className="flex-1 min-w-0 max-w-3xl xl:max-w-none mx-auto xl:mx-0">
          <div className="flex flex-col sm:flex-row items-start gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            {post.author_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.author_avatar} alt={post.author_name} className="w-20 h-20 rounded-2xl object-cover shrink-0 ring-2 ring-border" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold shrink-0">
                {post.author_name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">About the author</p>
              <p className="text-2xl font-bold text-foreground tracking-tight">{post.author_name}</p>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Contributing to the South Caravan blog with practical guidance on B2B procurement, wholesale trade,
                supplier verification, and growing your business across African and international markets.
              </p>
              <Button variant="outline" size="sm" className="mt-5" asChild>
                <Link href="/blog">
                  More from our blog
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
            </div>
            <div className="hidden xl:block w-[280px] shrink-0" aria-hidden />
          </div>
        </div>
      </section>

      {/* Comments */}
      {post.allow_comments && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex gap-10 xl:gap-14">
            <div className="flex-1 min-w-0 max-w-3xl xl:max-w-none mx-auto xl:mx-0">
          <header className="flex items-center gap-3 mb-8">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageSquare className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Discussion</h2>
              <p className="text-sm text-muted-foreground">
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </p>
            </div>
          </header>

          {comments.length > 0 && (
            <div className="space-y-4 mb-8">
              {comments.map((c) => (
                <CommentItem key={c.id} comment={c} />
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg font-semibold mb-1">Join the conversation</h3>
            <p className="text-sm text-muted-foreground mb-6">Comments are moderated before they appear publicly.</p>
            <CommentForm postId={post.id} onSubmitted={refreshComments} />
          </div>
            </div>
            <div className="hidden xl:block w-[280px] shrink-0" aria-hidden />
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-border bg-muted/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">Continue reading</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Related articles</h2>
              </div>
              <Button variant="outline" asChild className="shrink-0 w-fit">
                <Link href="/blog">
                  View all articles
                  <ArrowRight className="ml-2 h-4 w-4" />
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
        style={{ background: 'linear-gradient(135deg,#ecfdf5 0%,#f8fafc 50%,#eff6ff 100%)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="rounded-2xl border border-emerald-200/80 bg-card/80 backdrop-blur-sm p-8 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left shadow-sm">
            <div className="max-w-lg">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 mb-2">South Caravan</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Put insights into action
              </h2>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Discover verified suppliers, post RFQs, and build trusted B2B relationships on Africa&apos;s wholesale marketplace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-end shrink-0">
              <Button size="lg" asChild>
                <Link href="/">
                  Explore marketplace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/blog">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to blog
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function BlogArticleSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-[3px] bg-muted w-1/3" />
      <div className="h-[min(48vh,400px)] bg-slate-900/90 animate-pulse" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-12">
          <div className="flex-1 max-w-3xl mx-auto space-y-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-32" />
            <div className="rounded-2xl border border-border bg-card p-10 space-y-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded" style={{ width: `${92 - i * 4}%` }} />
              ))}
            </div>
          </div>
          <div className="hidden xl:block w-[280px] space-y-4 animate-pulse">
            <div className="h-48 bg-muted rounded-2xl" />
            <div className="h-36 bg-muted rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
