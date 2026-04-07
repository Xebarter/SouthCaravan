import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  DEFAULT_MARKETPLACE_TAXONOMY,
  type DefaultMarketplaceSection,
} from '@/lib/default-marketplace-taxonomy'

type CategoryRow = {
  id: string
  name: string
  level: number
  parent_id: string | null
}

const CACHE_KEY = '__sc_marketplace_menu_sections__'
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes
const FALLBACK_TTL_MS = 30 * 1000 // if the DB is empty, re-check quickly

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function buildMenuSections(rows: CategoryRow[]): DefaultMarketplaceSection[] {
  const level1 = rows.filter((row) => row.level === 1)
  const level2 = rows.filter((row) => row.level === 2)

  return level1.map((category) => {
    const items = level2
      .filter((sub) => sub.parent_id === category.id)
      .map((sub) => sub.name)

    return { title: category.name, items }
  })
}

/** Merge duplicate level-1 names (e.g. after renames/imports) into one section with combined items. */
function dedupeMenuSectionsByTitle(sections: DefaultMarketplaceSection[]): DefaultMarketplaceSection[] {
  const order: string[] = []
  const itemsByTitle = new Map<string, Set<string>>()

  for (const s of sections) {
    if (!itemsByTitle.has(s.title)) {
      order.push(s.title)
      itemsByTitle.set(s.title, new Set())
    }
    const set = itemsByTitle.get(s.title)!
    for (const item of s.items) set.add(item)
  }

  return order.map((title) => ({
    title,
    items: [...(itemsByTitle.get(title) ?? new Set())],
  }))
}

async function seedDefaultCategoriesIfEmpty() {
  // If there are already rows, do nothing.
  const { count, error: countError } = await supabaseAdmin
    .from('product_categories')
    .select('id', { count: 'exact', head: true })

  if (countError || (count ?? 0) > 0) return

  for (let i = 0; i < DEFAULT_MARKETPLACE_TAXONOMY.length; i += 1) {
    const section = DEFAULT_MARKETPLACE_TAXONOMY[i]

    const { data: parent, error: parentError } = await supabaseAdmin
      .from('product_categories')
      .insert({
        name: section.title,
        slug: slugify(section.title),
        level: 1,
        parent_id: null,
        is_active: true,
        sort_order: i,
      })
      .select('id')
      .single()

    if (parentError || !parent?.id) continue

    for (let j = 0; j < section.items.length; j += 1) {
      const item = section.items[j]

      await supabaseAdmin.from('product_categories').insert({
        name: item,
        slug: slugify(item),
        level: 2,
        parent_id: parent.id,
        is_active: true,
        sort_order: j,
      })
    }
  }
}

export async function getMarketplaceMenuSections(): Promise<DefaultMarketplaceSection[]> {
  const now = Date.now()
  const cached = (globalThis as any)[CACHE_KEY] as
    | { fetchedAt: number; sections: DefaultMarketplaceSection[] }
    | undefined

  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.sections
  }

  try {
    const { count, error: countError } = await supabaseAdmin
      .from('product_categories')
      .select('id', { count: 'exact', head: true })

    if (countError || (count ?? 0) === 0) {
      // DB is empty: keep interaction instant with a snapshot, then seed best-effort in background.
      ;(globalThis as any)[CACHE_KEY] = {
        fetchedAt: now,
        sections: DEFAULT_MARKETPLACE_TAXONOMY,
      }

      // Fire and forget so we don't block page render / interaction-time rendering.
      void seedDefaultCategoriesIfEmpty().catch(() => {})

      // Force a quicker re-check if the seed hasn't completed yet.
      setTimeout(() => {
        const current = (globalThis as any)[CACHE_KEY] as
          | { fetchedAt: number; sections: DefaultMarketplaceSection[] }
          | undefined
        if (current && current.sections === DEFAULT_MARKETPLACE_TAXONOMY) {
          ;(globalThis as any)[CACHE_KEY] = undefined
        }
      }, FALLBACK_TTL_MS)

      return DEFAULT_MARKETPLACE_TAXONOMY
    }

    const { data, error } = await supabaseAdmin
      .from('product_categories')
      .select('id, name, level, parent_id')
      .eq('is_active', true)
      .order('level', { ascending: true })
      .order('name', { ascending: true })

    if (error || !data) {
      ;(globalThis as any)[CACHE_KEY] = {
        fetchedAt: now,
        sections: DEFAULT_MARKETPLACE_TAXONOMY,
      }
      return DEFAULT_MARKETPLACE_TAXONOMY
    }

    const sections = dedupeMenuSectionsByTitle(buildMenuSections(data as CategoryRow[]))
    const safeSections = sections.length ? sections : DEFAULT_MARKETPLACE_TAXONOMY

    ;(globalThis as any)[CACHE_KEY] = {
      fetchedAt: now,
      sections: safeSections,
    }

    return safeSections
  } catch {
    ;(globalThis as any)[CACHE_KEY] = {
      fetchedAt: now,
      sections: DEFAULT_MARKETPLACE_TAXONOMY,
    }
    return DEFAULT_MARKETPLACE_TAXONOMY
  }
}

