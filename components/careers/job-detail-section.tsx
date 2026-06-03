import type { ReactNode } from 'react'

type JobDetailSectionProps = {
  title: string
  children: ReactNode
  accent?: string
}

export function JobDetailSection({ title, children, accent = 'bg-primary' }: JobDetailSectionProps) {
  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-border bg-muted/30">
        <span className={`h-8 w-1 rounded-full ${accent}`} aria-hidden />
        <h2 className="text-base sm:text-lg font-bold text-foreground">{title}</h2>
      </div>
      <div className="px-5 sm:px-6 py-5 sm:py-6">
        <div className="prose prose-sm max-w-none text-foreground/85 whitespace-pre-wrap leading-relaxed">
          {children}
        </div>
      </div>
    </section>
  )
}
