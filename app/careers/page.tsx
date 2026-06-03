'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search, Star, SlidersHorizontal, Mail } from 'lucide-react';

import {
  CareersBottomCta,
  CareersHero,
  CareersWhyJoin,
} from '@/components/careers/careers-page-chrome';
import {
  CareersEmptyState,
  JobListingCard,
  JobListingSkeleton,
} from '@/components/careers/job-listing-card';
import type { CareerJob, Department } from '@/components/careers/shared';

export default function CareersPage() {
  const [jobs, setJobs] = useState<CareerJob[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('all');
  const [locationType, setLocationType] = useState('all');
  const [employmentType, setEmploymentType] = useState('all');
  const [page, setPage] = useState(1);

  const limit = 12;

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (dept !== 'all') params.set('department', dept);
    if (locationType !== 'all') params.set('location_type', locationType);
    if (employmentType !== 'all') params.set('employment_type', employmentType);
    try {
      const res = await fetch(`/api/careers?${params}`);
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setTotal(data.total ?? 0);
      if (data.departments?.length) setDepartments(data.departments);
    } finally {
      setLoading(false);
    }
  }, [page, search, dept, locationType, employmentType]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const totalPages = Math.ceil(total / limit);
  const featured = jobs.filter((j) => j.is_featured);
  const regular = jobs.filter((j) => !j.is_featured);

  const clearFilters = () => {
    setSearch('');
    setDept('all');
    setLocationType('all');
    setEmploymentType('all');
    setPage(1);
  };

  const hasActiveFilters =
    search || dept !== 'all' || locationType !== 'all' || employmentType !== 'all';

  return (
    <div className="min-h-screen bg-background">
      <CareersHero openCount={total} loading={loading && jobs.length === 0} />
      <CareersWhyJoin />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Filters */}
          <aside className="lg:w-72 shrink-0">
            <Card className="rounded-2xl border-border shadow-sm lg:sticky lg:top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  Filter roles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pb-6">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Search
                  </p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Role title or keyword…"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      className="pl-9 rounded-lg"
                    />
                  </div>
                </div>

                {departments.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Department
                    </p>
                    <div className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-1">
                      <FilterChip active={dept === 'all'} onClick={() => { setDept('all'); setPage(1); }}>
                        All
                      </FilterChip>
                      {departments.map((d) => (
                        <FilterChip
                          key={d.slug}
                          active={dept === d.slug}
                          onClick={() => { setDept(d.slug); setPage(1); }}
                        >
                          {d.name}
                        </FilterChip>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Work type
                  </p>
                  <Select value={locationType} onValueChange={(v) => { setLocationType(v); setPage(1); }}>
                    <SelectTrigger className="h-10 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Employment
                  </p>
                  <Select value={employmentType} onValueChange={(v) => { setEmploymentType(v); setPage(1); }}>
                    <SelectTrigger className="h-10 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="full_time">Full-time</SelectItem>
                      <SelectItem value="part_time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button variant="outline" size="sm" className="w-full rounded-lg" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}

                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
                  <p className="text-sm font-semibold text-foreground">Open application</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-3 leading-relaxed">
                    No matching role? Tell us what you&apos;d like to do.
                  </p>
                  <Button size="sm" variant="outline" className="w-full rounded-lg gap-2" asChild>
                    <a href="mailto:careers@southcaravan.com">
                      <Mail className="h-3.5 w-3.5" />
                      Get in touch
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Listings */}
          <div className="flex-1 min-w-0 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">
                  Open positions
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {loading ? 'Loading…' : `${total} role${total !== 1 ? 's' : ''} found`}
                </p>
              </div>
              <Link
                href="/about"
                className="text-xs font-medium text-primary hover:underline underline-offset-2"
              >
                Learn about our company →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <JobListingSkeleton key={i} />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <CareersEmptyState onClear={clearFilters} />
            ) : (
              <>
                {featured.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-amber-500" />
                      Featured roles
                    </p>
                    {featured.map((job) => (
                      <JobListingCard key={job.id} job={job} featured />
                    ))}
                  </div>
                )}

                {regular.length > 0 && (
                  <div className="space-y-4">
                    {featured.length > 0 && (
                      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground pt-2">
                        All positions
                      </p>
                    )}
                    {regular.map((job) => (
                      <JobListingCard key={job.id} job={job} />
                    ))}
                  </div>
                )}
              </>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground tabular-nums">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <CareersBottomCta />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-muted/50 text-foreground/80 hover:bg-muted border border-transparent hover:border-border',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
