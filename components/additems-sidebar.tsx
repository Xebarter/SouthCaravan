'use client'

import * as React from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

export type AddItemsNode = { title: string; children?: AddItemsNode[] }

type FlatRow = { title: string; breadcrumb: string }

function flattenTree(nodes: AddItemsNode[], ancestors: string[] = []): FlatRow[] {
  const rows: FlatRow[] = []
  for (const node of nodes) {
    const breadcrumb = ancestors.join(' › ')
    rows.push({ title: node.title, breadcrumb })
    if (node.children?.length) {
      rows.push(...flattenTree(node.children, [...ancestors, node.title]))
    }
  }
  return rows
}

/** Lower is better. Title matches beat breadcrumb-only matches (per additems spec). */
function rankRow(row: FlatRow, query: string) {
  const q = query.toLowerCase()
  const title = row.title.toLowerCase()
  const crumb = row.breadcrumb.toLowerCase()

  if (title === q) return 0
  if (title.startsWith(q)) return 1
  if (title.includes(q)) return 2
  if (crumb === q) return 3
  if (crumb.startsWith(q)) return 4
  if (crumb.includes(q)) return 5
  return 6
}

function BrowseTree({
  nodes,
  depth = 0,
  ancestors = [],
  pinned,
  onRequestClose,
}: {
  nodes: AddItemsNode[]
  depth?: number
  ancestors?: string[]
  pinned: boolean
  onRequestClose: () => void
}) {
  return (
    <ul className={depth === 0 ? 'space-y-0.5' : 'space-y-0.5 ml-0.5 mt-1 border-l border-border/50 pl-2.5'}>
      {nodes.map((node) => {
        const category = ancestors[0] ?? node.title
        const subcategory = ancestors.length > 0 ? node.title : ''
        const href =
          ancestors.length === 0
            ? `/categories?category=${encodeURIComponent(node.title)}`
            : `/categories?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`
        const hasChildren = Boolean(node.children?.length)

        if (hasChildren) {
          return (
            <li key={`${depth}:${node.title}`}>
              <details className="group rounded-md">
                <summary className="flex cursor-pointer list-none items-stretch gap-0.5 rounded-md py-0.5 marker:content-none [&::-webkit-details-marker]:hidden">
                  <span
                    className="flex w-6 shrink-0 items-center justify-center rounded-md text-xs text-muted-foreground transition group-open:rotate-90"
                    aria-hidden
                  >
                    ›
                  </span>
                  <Link
                    href={href}
                    className="min-w-0 flex-1 rounded-md px-2 py-1.5 text-left text-sm font-medium leading-snug text-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      if (!pinned) onRequestClose()
                    }}
                  >
                    {node.title}
                  </Link>
                </summary>
                {node.children?.length ? (
                  <BrowseTree
                    nodes={node.children}
                    depth={depth + 1}
                    ancestors={[...ancestors, node.title]}
                    pinned={pinned}
                    onRequestClose={onRequestClose}
                  />
                ) : null}
              </details>
            </li>
          )
        }

        return (
          <li key={`${depth}:${node.title}`}>
            <Link
              href={href}
              className="block w-full rounded-md px-2 py-2 pl-8 text-left text-sm leading-snug text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                if (!pinned) onRequestClose()
              }}
            >
              {node.title}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export function AddItemsSidebar({
  open,
  pinned,
  onRequestClose,
  onMouseEnter,
  onMouseLeave,
}: {
  open: boolean
  pinned: boolean
  onRequestClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}) {
  const [items, setItems] = React.useState<AddItemsNode[] | null>(null)
  const [query, setQuery] = React.useState('')

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/additems', { cache: 'no-store' })
        if (!res.ok) {
          if (mounted) setItems([])
          return
        }

        const contentType = res.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
          if (mounted) setItems([])
          return
        }

        const json = await res.json().catch(() => null)
        const next = Array.isArray((json as any)?.items) ? ((json as any).items as AddItemsNode[]) : []
        if (mounted) setItems(next)
      } catch {
        if (mounted) setItems([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const trimmedQuery = query.trim()
  const listMode = trimmedQuery.length > 0

  let content: React.ReactNode = null
  if (items === null) {
    content = (
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
      </div>
    )
  } else if (items.length === 0) {
    content = <div className="p-4 text-sm text-muted-foreground">No categories loaded.</div>
  } else if (listMode) {
    const rows = flattenTree(items)
    const q = trimmedQuery.toLowerCase()
    const matches = rows
      .filter((row) => row.title.toLowerCase().includes(q) || row.breadcrumb.toLowerCase().includes(q))
      .sort((a, b) => {
        const ra = rankRow(a, q)
        const rb = rankRow(b, q)
        if (ra !== rb) return ra - rb
        return a.title.localeCompare(b.title)
      })

    if (!matches.length) {
      content = (
        <div className="p-4 text-sm text-muted-foreground">
          No categories match &quot;{trimmedQuery}&quot;. Try a shorter word (for example &quot;brake&quot; or &quot;filter&quot;).
        </div>
      )
    } else {
      content = (
        <ul className="space-y-1 p-2">
          {matches.map((row) => {
            const parts = row.breadcrumb ? row.breadcrumb.split(' › ') : []
            const category = parts[0] ?? row.title
            const href =
              parts.length === 0
                ? `/categories?category=${encodeURIComponent(row.title)}`
                : `/categories?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(row.title)}`
            return (
              <li key={`${row.breadcrumb}:${row.title}`}>
                <Link
                  href={href}
                  className="block rounded-lg border border-transparent px-3 py-2.5 text-left transition hover:border-border hover:bg-muted/40"
                  onClick={() => {
                    if (!pinned) onRequestClose()
                  }}
                >
                  {row.breadcrumb ? (
                    <p className="mb-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{row.breadcrumb}</p>
                  ) : null}
                  <p className="text-sm font-medium leading-snug text-foreground">{row.title}</p>
                </Link>
              </li>
            )
          })}
        </ul>
      )
    }
  } else {
    content = (
      <div className="p-2 pb-4">
        <BrowseTree nodes={items} pinned={pinned} onRequestClose={onRequestClose} />
      </div>
    )
  }

  return (
    <aside
      className={`fixed left-0 top-14 z-50 flex h-[calc(100vh-3.5rem)] w-[min(100vw-1rem,340px)] max-w-[86vw] flex-col overflow-hidden border-r border-border bg-card shadow-xl transition-transform duration-200 md:top-16 md:h-[calc(100vh-4rem)] ${
        open ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-hidden={!open}
    >
      <div className="flex shrink-0 flex-col gap-2 border-b border-border px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">Find parts</div>
            <p className="text-[11px] leading-snug text-muted-foreground">Search the menu, then open a category.</p>
          </div>
          {pinned ? (
            <button
              type="button"
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={onRequestClose}
            >
              Close
            </button>
          ) : null}
        </div>

        <Link
          href="/"
          className="text-xs font-medium text-primary hover:underline"
          onClick={() => {
            if (!pinned) onRequestClose()
          }}
        >
          View all products
        </Link>

        <label className="relative block">
          <span className="sr-only">Search categories</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            autoComplete="off"
            placeholder="e.g. brake pads, oil filter..."
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">{content}</div>
    </aside>
  )
}

