'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from './rich-text-editor';
import { Save, Eye, X, Plus, Image as ImageIcon, Tag } from 'lucide-react';
import type { BlogPost, BlogCategory, BlogTag } from '@/lib/types';

interface PostEditorProps {
  post?: BlogPost;
  mode: 'new' | 'edit';
}

function slugify(text: string) {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function PostEditor({ post, mode }: PostEditorProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [allTags, setAllTags] = useState<BlogTag[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [slugManual, setSlugManual] = useState(!!post?.slug);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [content, setContent] = useState(post?.content ?? '');
  const [status, setStatus] = useState<string>(post?.status ?? 'draft');
  const [categoryId, setCategoryId] = useState(post?.category_id ?? '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    post?.tags?.map((t) => t.id) ?? [],
  );
  const [authorName, setAuthorName] = useState(post?.author_name ?? 'SouthCaravan Team');
  const [featured, setFeatured] = useState(post?.featured ?? false);
  const [allowComments, setAllowComments] = useState(post?.allow_comments ?? true);
  const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? '');
  const [metaDescription, setMetaDescription] = useState(post?.meta_description ?? '');
  const [coverImage, setCoverImage] = useState(post?.cover_image ?? '');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState(post?.cover_image ?? '');
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    fetch('/api/admin/blog/categories').then((r) => r.json()).then((d) => setCategories(d.categories ?? []));
    fetch('/api/admin/blog/tags').then((r) => r.json()).then((d) => setAllTags(d.tags ?? []));
  }, []);

  useEffect(() => {
    if (!slugManual && title) setSlug(slugify(title));
  }, [title, slugManual]);

  function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverImageFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }

  async function createTag() {
    if (!newTagName.trim()) return;
    const res = await fetch('/api/admin/blog/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTagName.trim() }),
    });
    const data = await res.json();
    if (data.tag) {
      setAllTags((prev) => [data.tag, ...prev]);
      setSelectedTagIds((prev) => [...prev, data.tag.id]);
      setNewTagName('');
    }
  }

  async function handleSave(targetStatus?: string) {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('slug', slug);
      fd.append('excerpt', excerpt);
      fd.append('content', content);
      fd.append('status', targetStatus ?? status);
      fd.append('author_name', authorName);
      fd.append('category_id', categoryId);
      fd.append('meta_title', metaTitle);
      fd.append('meta_description', metaDescription);
      fd.append('featured', String(featured));
      fd.append('allow_comments', String(allowComments));
      fd.append('tag_ids', JSON.stringify(selectedTagIds));
      if (coverImageFile) {
        fd.append('cover_image_file', coverImageFile);
      } else if (coverImage) {
        fd.append('cover_image', coverImage);
      }

      let res: Response;
      if (mode === 'new') {
        res = await fetch('/api/admin/blog', { method: 'POST', body: fd });
      } else {
        fd.append('id', post!.id);
        res = await fetch('/api/admin/blog', { method: 'PATCH', body: fd });
      }

      if (res.ok) {
        setSaveStatus('saved');
        if (mode === 'new') {
          const data = await res.json();
          router.push(`/admin/blog/${data.post.id}/edit`);
        } else {
          if (targetStatus) setStatus(targetStatus);
        }
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{mode === 'new' ? 'New Post' : 'Edit Post'}</h1>
          {saveStatus === 'saved' && <p className="text-xs text-green-600 mt-0.5">Changes saved.</p>}
          {saveStatus === 'error' && <p className="text-xs text-destructive mt-0.5">Save failed. Please try again.</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={slug ? `/blog/${slug}` : '/blog'} target="_blank" rel="noopener">
              <Eye className="w-4 h-4 mr-1.5" /> Preview
            </a>
          </Button>
          {status !== 'published' && (
            <Button
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => handleSave('draft')}
            >
              Save Draft
            </Button>
          )}
          <Button
            size="sm"
            disabled={saving || !title.trim()}
            onClick={() => handleSave(status === 'published' ? 'published' : 'published')}
          >
            <Save className="w-4 h-4 mr-1.5" />
            {status === 'published' ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="xl:col-span-2 space-y-5">
          {/* Title + Slug */}
          <Card className="border-border/50">
            <CardContent className="pt-5 space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title…"
                  className="mt-1.5 text-base font-semibold"
                />
              </div>
              <div>
                <Label htmlFor="slug" className="text-sm font-medium">Slug</Label>
                <div className="flex gap-2 mt-1.5">
                  <span className="flex items-center px-3 rounded-l-md border border-r-0 border-border bg-muted text-xs text-muted-foreground">/blog/</span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                    placeholder="post-url-slug"
                    className="rounded-l-none font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="excerpt" className="text-sm font-medium">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Short description shown in listing pages…"
                  rows={2}
                  className="mt-1.5 text-sm resize-none"
                  maxLength={300}
                />
                <p className="text-[11px] text-muted-foreground mt-1">{excerpt.length}/300</p>
              </div>
            </CardContent>
          </Card>

          {/* Rich text editor */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Content</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write your post content here…"
                minHeight={480}
              />
            </CardContent>
          </Card>

          {/* SEO */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">SEO</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div>
                <Label htmlFor="meta_title" className="text-sm">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={title || 'Meta title (defaults to post title)'}
                  maxLength={70}
                  className="mt-1.5 text-sm"
                />
                <p className="text-[11px] text-muted-foreground mt-1">{metaTitle.length}/70</p>
              </div>
              <div>
                <Label htmlFor="meta_desc" className="text-sm">Meta Description</Label>
                <Textarea
                  id="meta_desc"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder={excerpt || 'Meta description for search engines…'}
                  rows={2}
                  maxLength={160}
                  className="mt-1.5 text-sm resize-none"
                />
                <p className="text-[11px] text-muted-foreground mt-1">{metaDescription.length}/160</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Status + Author */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Publish Settings</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div>
                <Label className="text-sm">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="author_name" className="text-sm">Author Name</Label>
                <Input
                  id="author_name"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="mt-1.5 text-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="featured_switch" className="text-sm cursor-pointer">Featured post</Label>
                <Switch
                  id="featured_switch"
                  checked={featured}
                  onCheckedChange={setFeatured}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="comments_switch" className="text-sm cursor-pointer">Allow comments</Label>
                <Switch
                  id="comments_switch"
                  checked={allowComments}
                  onCheckedChange={setAllowComments}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cover Image */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Cover Image</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {coverPreview ? (
                <div className="relative rounded-lg overflow-hidden border border-border group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-full h-36 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => { setCoverPreview(''); setCoverImage(''); setCoverImageFile(null); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full h-28 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-xs">Click to upload cover</span>
                </button>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverFileChange}
              />
              {coverPreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => coverInputRef.current?.click()}
                >
                  Change image
                </Button>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Or paste URL</Label>
                <Input
                  value={coverImage}
                  onChange={(e) => { setCoverImage(e.target.value); setCoverPreview(e.target.value); setCoverImageFile(null); }}
                  placeholder="https://…"
                  className="mt-1 text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Category</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Select value={categoryId || 'none'} onValueChange={(v) => setCategoryId(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {/* Selected */}
              {selectedTagIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTagIds.map((tagId) => {
                    const tag = allTags.find((t) => t.id === tagId);
                    return tag ? (
                      <Badge
                        key={tagId}
                        variant="secondary"
                        className="gap-1 cursor-pointer text-xs"
                        onClick={() => toggleTag(tagId)}
                      >
                        {tag.name}
                        <X className="w-2.5 h-2.5" />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}

              {/* Available tags */}
              <div className="flex flex-wrap gap-1.5">
                {allTags.filter((t) => !selectedTagIds.includes(t.id)).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="cursor-pointer text-xs hover:bg-secondary"
                    onClick={() => toggleTag(tag.id)}
                  >
                    + {tag.name}
                  </Badge>
                ))}
              </div>

              {/* Create new tag */}
              <div className="flex gap-1.5">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="New tag…"
                  className="text-xs h-7"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), createTag())}
                />
                <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={createTag}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
