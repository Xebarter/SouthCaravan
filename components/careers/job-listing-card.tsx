'use client'

import Link from 'next/link'
import { ArrowRight, Briefcase, Clock, MapPin, Star, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { CareerJob } from '@/components/careers/shared'
import { EMP_LABELS, EXP_LABELS, fmtPosted, fmtSalary, LOC_LABELS } from '@/components/careers/shared'

type JobListingCardProps = {
  job: CareerJob
  featured?: boolean
}

export function JobListingCard({ job, featured = false }: JobListingCardProps) {
  const salary = fmtSalary(job)
  const posted = fmtPosted(job.posted_at)
  const deadline = job.application_deadline ? new Date(job.application_deadline) : null
  const isExpiringSoon = deadline && deadline.getTime() - Date.now() < 7 * 86_400_000

  return (
    <Link href={`/careers/${job.slug}`} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-2xl">
      <Card
        className={[
          'overflow-hidden border transition-all duration-200',
          'hover:shadow-lg hover:border-primary/25 hover:-translate-y-0.5',
          featured
            ? 'border-amber-200/80 bg-linear-to-br from-amber-50/50 via-card to-card shadow-sm'
            : 'border-border bg-card',
        ].join(' ')}
      >
        <CardContent className="p-0 flex">
          <div
            className={[
              'w-1 shrink-0',
              featured ? 'bg-amber-400' : 'bg-primary/80 group-hover:bg-primary',
            ].join(' ')}
            aria-hidden
          />
          <div className="flex-1 min-w-0 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {featured && (
                    <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-800 text-[10px] font-semibold">
                      <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                      Featured
                    </Badge>
                  )}
                  {job.is_urgent && (
                    <Badge variant="outline" className="gap-1 border-red-200 bg-red-50 text-red-700 text-[10px] font-semibold">
                      <Zap className="h-2.5 w-2.5 fill-red-500 text-red-500" />
                      Urgent
                    </Badge>
                  )}
                  {job.department && (
                    <Badge variant="secondary" className="text-[10px] font-medium bg-primary/8 text-primary border-primary/15">
                      {job.department.name}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
                    {EMP_LABELS[job.employment_type] ?? job.employment_type}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
                    {EXP_LABELS[job.experience_level] ?? job.experience_level}
                  </Badge>
                </div>

                <div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {job.title}
                  </h2>
                  {job.summary && (
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">{job.summary}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                    {job.location} · {LOC_LABELS[job.location_type] ?? job.location_type}
                  </span>
                  {salary && <span className="font-semibold text-emerald-700">{salary}</span>}
                  {posted && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {posted}
                    </span>
                  )}
                  {isExpiringSoon && deadline && (
                    <span className="font-medium text-orange-600">
                      Closes {deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>

              <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground transition-all group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary">
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function JobListingSkeleton() {
  return (
    <Card className="rounded-2xl border-border overflow-hidden">
      <CardContent className="p-6 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
          <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="h-6 w-3/4 max-w-sm rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-full rounded-md bg-muted/70 animate-pulse" />
        <div className="h-4 w-2/3 rounded-md bg-muted/70 animate-pulse" />
      </CardContent>
    </Card>
  )
}

export function CareersEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-8 py-16 text-center">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Briefcase className="h-7 w-7 text-muted-foreground/50" />
      </span>
      <p className="text-lg font-semibold text-foreground">No positions match your filters</p>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
        Try broadening your search or check back soon — we add new roles regularly.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-6 inline-flex items-center rounded-lg border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        Clear all filters
      </button>
    </div>
  )
}
