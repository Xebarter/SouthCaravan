import Link from 'next/link'
import { Briefcase, Globe2, Heart, Sparkles, Users } from 'lucide-react'

import { WHY_JOIN } from '@/components/careers/shared'

type CareersHeroProps = {
  openCount: number
  loading?: boolean
}

export function CareersHero({ openCount, loading }: CareersHeroProps) {
  const countLabel = loading
    ? 'Loading openings…'
    : `${openCount} open role${openCount !== 1 ? 's' : ''}`

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, transparent) 0%, transparent 45%, color-mix(in srgb, #0ea5e9 6%, transparent) 100%)',
        }}
        aria-hidden
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 md:py-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary mb-6">
            <Briefcase className="h-3.5 w-3.5" />
            {countLabel}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Build the future of{' '}
            <span className="text-primary">African commerce</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Join South Caravan and help connect buyers and suppliers worldwide. We&apos;re a fast-growing team
            that values impact, integrity, and collaboration.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl">
          {[
            { icon: Globe2, label: 'Global mission', sub: 'Trade across borders' },
            { icon: Users, label: 'Collaborative', sub: 'Cross-functional teams' },
            { icon: Sparkles, label: 'High impact', sub: 'Ship what matters' },
            { icon: Heart, label: 'People first', sub: 'Respect & inclusion' },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="rounded-xl border border-border/80 bg-card/80 backdrop-blur-sm px-3 py-3 sm:px-4 sm:py-4 shadow-sm"
            >
              <Icon className="h-4 w-4 text-primary mb-2" />
              <p className="text-xs sm:text-sm font-bold text-foreground">{label}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CareersWhyJoin() {
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
        <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Why South Caravan</p>
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground mb-8">More than a job — a place to grow</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WHY_JOIN.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${item.color}`}>
                {item.title.charAt(0)}
              </span>
              <p className="mt-4 text-sm font-bold text-foreground">{item.title}</p>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CareersBottomCta() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
      <div
        className="rounded-2xl overflow-hidden border border-border px-6 sm:px-10 py-10 sm:py-12 text-center relative"
        style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #eff6ff 100%)' }}
      >
        <p className="text-[11px] uppercase tracking-widest font-bold text-primary mb-3">General applications</p>
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">Don&apos;t see the right role?</h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          We&apos;re always interested in exceptional talent. Send your CV and a short note about what you&apos;d
          like to work on.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href="mailto:careers@southcaravan.com"
            className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-hover px-6 py-3 text-sm font-bold text-primary-foreground transition-colors shadow-sm"
          >
            Email careers@southcaravan.com
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:border-primary/30 transition-colors"
          >
            Contact us
          </Link>
        </div>
      </div>
    </section>
  )
}
