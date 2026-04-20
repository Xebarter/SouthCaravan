'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, BookOpen, Calendar, Clock, Eye, Heart, MessageSquare,
  Share2, Tag, Twitter, Linkedin, LinkIcon, CheckCircle,
} from 'lucide-react';
import type { BlogPost, BlogComment } from '@/lib/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

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
      <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
        {comment.author_name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-semibold">{comment.author_name}</span>
          <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
        </div>
        <p className="text-sm text-foreground/85 leading-relaxed">{comment.content}</p>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4 pl-4 border-l-2 border-border">
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
          <Input
            id="comment_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1.5"
            placeholder="Your name"
          />
        </div>
        <div>
          <Label htmlFor="comment_email">Email (optional, not shown)</Label>
          <Input
            id="comment_email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5"
            placeholder="your@email.com"
          />
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
          className="mt-1.5 resize-none"
          placeholder="Share your thoughts…"
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground mt-1">{content.length}/2000</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={submitting || !name.trim() || !content.trim()}>
        {submitting ? 'Submitting…' : 'Post Comment'}
      </Button>
    </form>
  );
}

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/blog/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.replace('/blog'); return; }
        setPost(data.post);
        setRelated(data.related ?? []);
        setLikeCount(data.post.like_count ?? 0);
        setLoading(false);
      });
  }, [slug, router]);

  async function fetchComments() {
    if (!post) return;
    const res = await fetch(`/api/blog/comments?post_id=${post.id}`);
    const data = await res.json();
    setComments(data.comments ?? []);
  }

  useEffect(() => { if (post) fetchComments(); }, [post]);

  async function handleLike() {
    if (!post) return;
    const sessionId = getOrCreateSessionId();
    const res = await fetch('/api/blog/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id, session_id: sessionId }),
    });
    const data = await res.json();
    if (res.ok) {
      setLiked(data.reacted);
      setLikeCount(data.like_count);
    }
  }

  function handleShare(platform: 'twitter' | 'linkedin' | 'copy') {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = post?.title ?? '';
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else {
      navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-10 bg-muted rounded w-full" />
        <div className="h-64 bg-muted rounded-2xl" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-4 bg-muted rounded" />)}
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="bg-background min-h-screen">
      {/* Back */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>
      </div>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Category + tags */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {post.category && (
            <Link href={`/blog?category=${post.category.slug}`}>
              <span
                className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full cursor-pointer"
                style={{ backgroundColor: `${post.category.color}20`, color: post.category.color }}
              >
                {post.category.name}
              </span>
            </Link>
          )}
          {post.tags?.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="text-[11px]">
              <Tag className="w-2.5 h-2.5 mr-1" />{tag.name}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight tracking-tight">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-3 text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 mt-5 pb-5 border-b border-border text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
              {post.author_name.charAt(0)}
            </div>
            <span className="font-medium text-foreground/80">{post.author_name}</span>
          </div>
          {post.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(post.published_at)}
            </span>
          )}
          {post.read_time_mins && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.read_time_mins} min read
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {post.view_count.toLocaleString()} views
          </span>
        </div>

        {/* Cover image */}
        {post.cover_image && (
          <div className="my-8 rounded-2xl overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover_image}
              alt={post.cover_image_alt ?? post.title}
              className="w-full max-h-[480px] object-cover"
            />
          </div>
        )}

        {/* Body */}
        <div
          className="prose prose-base max-w-none mt-8
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-4 prose-blockquote:border-primary/40 prose-blockquote:pl-4 prose-blockquote:text-muted-foreground
            prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-muted prose-pre:rounded-xl prose-pre:p-4
            prose-img:rounded-xl prose-img:border prose-img:border-border
            prose-hr:border-border"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Reactions + Share */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-10 py-5 border-t border-b border-border">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors text-sm font-medium ${
              liked
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'border-border hover:border-red-200 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1">Share:</span>
            <button
              onClick={() => handleShare('twitter')}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
            >
              <Twitter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleShare('copy')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs hover:border-primary hover:text-primary transition-colors"
            >
              <LinkIcon className="w-3 h-3" />
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>

        {/* Author bio */}
        <div className="mt-8 flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
            {post.author_name.charAt(0)}
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-0.5">Written by</p>
            <p className="font-bold text-foreground">{post.author_name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Part of the SouthCaravan editorial team, covering B2B procurement insights and platform developments.
            </p>
          </div>
        </div>

        {/* Comments */}
        {post.allow_comments && (
          <div className="mt-12 space-y-8">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">Comments</h2>
              <span className="text-sm text-muted-foreground">
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </span>
            </div>

            {comments.length > 0 && (
              <div className="space-y-6">
                {comments.map((c) => <CommentItem key={c.id} comment={c} />)}
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Leave a comment
              </h3>
              <CommentForm postId={post.id} onSubmitted={fetchComments} />
            </div>
          </div>
        )}
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <div className="border-t border-border bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            <h2 className="text-xl font-bold mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {related.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/blog/${rp.slug}`}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-36 overflow-hidden bg-muted">
                    {rp.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={rp.cover_image}
                        alt={rp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/10 to-primary/5">
                        <BookOpen className="w-8 h-8 text-primary/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                      {rp.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      {rp.read_time_mins && <span>{rp.read_time_mins} min</span>}
                      {rp.published_at && <span>{formatDate(rp.published_at)}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
