'use client';

import { useMemo, useState } from 'react';
import { useEffect } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  level: number;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const source = text;
  const needle = query.trim().toLowerCase();
  const lower = source.toLowerCase();

  const chunks: { text: string; match: boolean }[] = [];
  let cursor = 0;

  while (cursor < source.length) {
    const index = lower.indexOf(needle, cursor);
    if (index === -1) {
      chunks.push({ text: source.slice(cursor), match: false });
      break;
    }
    if (index > cursor) {
      chunks.push({ text: source.slice(cursor, index), match: false });
    }
    chunks.push({ text: source.slice(index, index + needle.length), match: true });
    cursor = index + needle.length;
  }

  return (
    <>
      {chunks.map((chunk, idx) =>
        chunk.match ? (
          <mark key={`${chunk.text}-${idx}`} className="bg-amber-200/70 dark:bg-amber-500/30 rounded-sm px-0.5">
            {chunk.text}
          </mark>
        ) : (
          <span key={`${chunk.text}-${idx}`}>{chunk.text}</span>
        ),
      )}
    </>
  );
}

export default function AdminCartegoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickAddLevel2ByParent, setQuickAddLevel2ByParent] = useState<Record<string, string>>({});
  const [quickAddingParentId, setQuickAddingParentId] = useState<string | null>(null);
  const [expandedParentIds, setExpandedParentIds] = useState<Record<string, boolean>>({});
  const [formName, setFormName] = useState('');
  const [formLevel, setFormLevel] = useState('1');
  const [formParentId, setFormParentId] = useState('');

  async function fetchCategories() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/categories');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to load categories');
      const next = payload.categories ?? [];
      setCategories(next);
      const levelOne = next.filter((item: CategoryRow) => item.level === 1);
      setExpandedParentIds((prev) => {
        const merged: Record<string, boolean> = { ...prev };
        for (const item of levelOne) {
          if (merged[item.id] === undefined) merged[item.id] = false;
        }
        return merged;
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load categories');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  const level1 = useMemo(() => categories.filter((item) => item.level === 1), [categories]);
  const level2 = useMemo(() => categories.filter((item) => item.level === 2), [categories]);
  const level3 = useMemo(() => categories.filter((item) => item.level === 3), [categories]);
  const sortedLevel1 = useMemo(
    () => [...level1].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [level1],
  );
  const level2ByParent = useMemo(() => {
    const map = new Map<string, CategoryRow[]>();
    for (const row of level2) {
      if (!row.parent_id) continue;
      const group = map.get(row.parent_id) ?? [];
      group.push(row);
      map.set(row.parent_id, group);
    }
    for (const [key, group] of map.entries()) {
      map.set(key, [...group].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)));
    }
    return map;
  }, [level2]);
  const level3ByParent = useMemo(() => {
    const map = new Map<string, CategoryRow[]>();
    for (const row of level3) {
      if (!row.parent_id) continue;
      const group = map.get(row.parent_id) ?? [];
      group.push(row);
      map.set(row.parent_id, group);
    }
    for (const [key, group] of map.entries()) {
      map.set(key, [...group].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)));
    }
    return map;
  }, [level3]);

  const level2ParentOptions = useMemo(() => level1, [level1]);
  const level3ParentOptions = useMemo(() => level2, [level2]);

  const parentOptions = formLevel === '2' ? level2ParentOptions : formLevel === '3' ? level3ParentOptions : [];
  const query = searchQuery.trim().toLowerCase();

  useEffect(() => {
    if (formLevel === '1') {
      setFormParentId('');
      return;
    }
    if (parentOptions.length === 0) {
      setFormParentId('');
      return;
    }
    const exists = parentOptions.some((item) => item.id === formParentId);
    if (!exists) setFormParentId(parentOptions[0].id);
  }, [formLevel, parentOptions, formParentId]);

  async function createCategory() {
    if (!formName.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          level: Number(formLevel),
          parentId: formLevel === '1' ? null : formParentId,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to create category');
      toast.success('Category created');
      setFormName('');
      await fetchCategories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create category');
    } finally {
      setSaving(false);
    }
  }

  async function seedDefaultCategories() {
    setSeeding(true);
    try {
      const response = await fetch('/api/admin/categories/seed', { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to seed defaults');
      toast.success(
        `Seeded defaults: ${payload.insertedTopLevel ?? 0} top-level, ${payload.insertedSubcategories ?? 0} subcategories.`,
      );
      await fetchCategories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not seed defaults');
    } finally {
      setSeeding(false);
    }
  }

  async function resetToDefaults() {
    const ok = confirm(
      'Reset all categories to defaults? This will remove all custom categories and subcategories.',
    );
    if (!ok) return;

    setResetting(true);
    try {
      const response = await fetch('/api/admin/categories/reset', { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to reset categories');
      toast.success(
        `Reset complete: ${payload.insertedTopLevel ?? 0} top-level and ${payload.insertedSubcategories ?? 0} subcategories.`,
      );
      await fetchCategories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not reset categories');
    } finally {
      setResetting(false);
    }
  }

  async function toggleActive(item: CategoryRow, checked: boolean) {
    const response = await fetch('/api/admin/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, isActive: checked }),
    });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error ?? 'Update failed');
      return;
    }
    setCategories((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, is_active: checked } : entry)));
  }

  async function deleteCategory(item: CategoryRow) {
    if (!confirm(`Delete "${item.name}"? Child categories will also be deleted.`)) return;
    const response = await fetch(`/api/admin/categories?id=${item.id}`, { method: 'DELETE' });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error ?? 'Delete failed');
      return;
    }
    toast.success('Category deleted');
    await fetchCategories();
  }

  async function updateSort(item: CategoryRow, value: string) {
    const sortOrder = Number(value);
    if (Number.isNaN(sortOrder)) return;
    await fetch('/api/admin/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, sortOrder }),
    });
    setCategories((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, sort_order: sortOrder } : entry)));
  }

  async function quickAddLevel2(parent: CategoryRow) {
    const name = (quickAddLevel2ByParent[parent.id] ?? '').trim();
    if (!name) {
      toast.error('Enter a level 2 category name');
      return;
    }

    setQuickAddingParentId(parent.id);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          level: 2,
          parentId: parent.id,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to add subcategory');

      setQuickAddLevel2ByParent((prev) => ({ ...prev, [parent.id]: '' }));
      toast.success(`Added "${name}" under ${parent.name}`);
      await fetchCategories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add subcategory');
    } finally {
      setQuickAddingParentId(null);
    }
  }

  function RowControls({ item }: { item: CategoryRow }) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <Input
          type="number"
          value={item.sort_order}
          onChange={(event) =>
            setCategories((prev) =>
              prev.map((entry) =>
                entry.id === item.id ? { ...entry, sort_order: Number(event.target.value) || 0 } : entry,
              ),
            )
          }
          onBlur={(event) => updateSort(item, event.target.value)}
          className="w-14 h-8 text-xs"
        />
        <Badge variant={item.is_active ? 'default' : 'outline'}>
          {item.is_active ? 'Visible' : 'Hidden'}
        </Badge>
        <Switch
          checked={item.is_active}
          onCheckedChange={(checked) => toggleActive(item, checked)}
          aria-label={`Toggle ${item.name}`}
        />
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => deleteCategory(item)}
          aria-label={`Delete ${item.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  const filteredParents = useMemo(() => {
    if (!query) {
      return sortedLevel1.map((parent) => ({
        parent,
        parentMatch: false,
        subcategories: level2ByParent.get(parent.id) ?? [],
      }));
    }

    return sortedLevel1
      .map((parent) => {
        const allSub = level2ByParent.get(parent.id) ?? [];
        const parentMatch =
          parent.name.toLowerCase().includes(query) || parent.slug.toLowerCase().includes(query);

        if (parentMatch) {
          return { parent, parentMatch: true, subcategories: allSub };
        }

        const matchedSub = allSub
          .map((sub) => {
            const leaves = level3ByParent.get(sub.id) ?? [];
            const subMatch =
              sub.name.toLowerCase().includes(query) || sub.slug.toLowerCase().includes(query);
            if (subMatch) return { ...sub, _leaves: leaves };
            const matchedLeaves = leaves.filter(
              (leaf) =>
                leaf.name.toLowerCase().includes(query) || leaf.slug.toLowerCase().includes(query),
            );
            if (matchedLeaves.length > 0) return { ...sub, _leaves: matchedLeaves };
            return null;
          })
          .filter(Boolean) as (CategoryRow & { _leaves: CategoryRow[] })[];

        if (matchedSub.length === 0) return null;
        return {
          parent,
          parentMatch: false,
          subcategories: matchedSub,
        };
      })
      .filter(Boolean) as {
      parent: CategoryRow;
      parentMatch: boolean;
      subcategories: (CategoryRow & { _leaves?: CategoryRow[] })[];
    }[];
  }, [query, sortedLevel1, level2ByParent, level3ByParent]);

  function expandAllVisible() {
    setExpandedParentIds((prev) => {
      const next = { ...prev };
      for (const entry of filteredParents) {
        next[entry.parent.id] = true;
      }
      return next;
    });
  }

  function collapseAllVisible() {
    setExpandedParentIds((prev) => {
      const next = { ...prev };
      for (const entry of filteredParents) {
        next[entry.parent.id] = false;
      }
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cartegories & menu taxonomy</h2>
          <p className="text-muted-foreground mt-1">
            Control marketplace visibility and storefront navigation: top-level menu items (level 1), subcategories,
            and the same taxonomy used when creating products.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="#seed-taxonomy">Import taxonomy</a>
          </Button>
          <Button size="sm" asChild>
            <a href="#add-category" className="inline-flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add category
            </a>
          </Button>
        </div>
      </div>

      <Card id="seed-taxonomy">
        <CardHeader className="pb-3">
          <CardTitle>Default Cartegories</CardTitle>
          <CardDescription>
            Load the same default categories and subcategories currently shown in the home page sidebar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={seedDefaultCategories} disabled={seeding || resetting}>
              {seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Seed Sidebar Defaults
            </Button>
            <Button
              variant="destructive"
              onClick={resetToDefaults}
              disabled={resetting || seeding}
            >
              {resetting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
              Reset To Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card id="add-category">
        <CardHeader className="pb-3">
          <CardTitle>Add new category / top-level menu item</CardTitle>
          <CardDescription>
            Level 1 entries are the parent categories shown in the sidebar. For level 2, use quick add under each level
            1 row, or choose level and parent here.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4 lg:grid-cols-5">
          <Input
            placeholder="Display name"
            value={formName}
            onChange={(event) => setFormName(event.target.value)}
          />
          <Select value={formLevel} onValueChange={setFormLevel}>
            <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Level 1 (Category)</SelectItem>
              <SelectItem value="2">Level 2 (Subcategory)</SelectItem>
              <SelectItem value="3">Level 3 (Sub-subcategory)</SelectItem>
            </SelectContent>
          </Select>
          {formLevel === '1' ? (
            <Input disabled value="No parent required" />
          ) : (
            <Select value={formParentId} onValueChange={setFormParentId}>
              <SelectTrigger><SelectValue placeholder="Select parent" /></SelectTrigger>
              <SelectContent>
                {parentOptions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={createCategory} disabled={saving} className="md:col-span-1 lg:col-span-1">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Create
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-16 flex items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading categories...
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Category registry & hierarchy</CardTitle>
            <CardDescription>
              Parent categories (menu items), then level 2 and level 3. Toggle visibility, sort order, or remove entries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="sticky top-0 z-20 rounded-md border border-border bg-background/95 backdrop-blur p-2.5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search categories..."
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{filteredParents.length} level 1 shown</Badge>
                  <Button size="sm" variant="outline" onClick={expandAllVisible}>
                    Expand all
                  </Button>
                  <Button size="sm" variant="outline" onClick={collapseAllVisible}>
                    Collapse all
                  </Button>
                </div>
              </div>
            </div>

            {filteredParents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories match your search.</p>
            ) : (
              filteredParents.map(({ parent, subcategories }) => {
                const expanded = expandedParentIds[parent.id] ?? true;
                return (
                  <div key={parent.id} className="rounded-lg border border-border overflow-hidden">
                    <div className="w-full px-3 py-2.5 bg-card/40 flex items-center justify-between gap-3 hover:bg-secondary/40 transition-colors">
                      <button
                        type="button"
                        className="min-w-0 flex items-center gap-2 text-left flex-1"
                        onClick={() =>
                          setExpandedParentIds((prev) => ({ ...prev, [parent.id]: !expanded }))
                        }
                        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${parent.name}`}
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
                        {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        <div className="text-left">
                          <p className="font-semibold line-clamp-1">{highlightMatch(parent.name, searchQuery)}</p>
                          <p className="text-xs text-muted-foreground">/{parent.slug} • Level 1</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{subcategories.length} level 2</Badge>
                        <RowControls item={parent} />
                      </div>
                    </div>

                    {expanded && (
                      <div className="p-3 space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={quickAddLevel2ByParent[parent.id] ?? ''}
                            onChange={(event) =>
                              setQuickAddLevel2ByParent((prev) => ({ ...prev, [parent.id]: event.target.value }))
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                quickAddLevel2(parent);
                              }
                            }}
                            placeholder={`Quick add level 2 under "${parent.name}"`}
                            className="h-8"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              quickAddLevel2(parent);
                            }}
                            disabled={quickAddingParentId === parent.id}
                          >
                            {quickAddingParentId === parent.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>

                        {subcategories.length === 0 ? (
                          <p className="text-xs text-muted-foreground px-1">No level 2 categories yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {subcategories.map((sub) => {
                              const leaves = '_leaves' in sub ? sub._leaves ?? [] : level3ByParent.get(sub.id) ?? [];
                              return (
                                <div key={sub.id} className="rounded-md border border-border/70 bg-card/20 p-2.5 space-y-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="font-medium text-sm line-clamp-1">{highlightMatch(sub.name, searchQuery)}</p>
                                      <p className="text-xs text-muted-foreground">/{sub.slug} • Level 2</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">{leaves.length} level 3</Badge>
                                      <RowControls item={sub} />
                                    </div>
                                  </div>

                                  <div className="space-y-1 pl-3 border-l border-border/50">
                                    {leaves.length === 0 ? (
                                      <p className="text-xs text-muted-foreground">No level 3 categories.</p>
                                    ) : (
                                      leaves.map((leaf) => (
                                        <div key={leaf.id} className="rounded border border-border/60 px-2 py-1.5 flex items-center justify-between gap-2">
                                          <div className="min-w-0">
                                            <p className="text-sm line-clamp-1">{highlightMatch(leaf.name, searchQuery)}</p>
                                            <p className="text-xs text-muted-foreground">/{leaf.slug} • Level 3</p>
                                          </div>
                                          <RowControls item={leaf} />
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
