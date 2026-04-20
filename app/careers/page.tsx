'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Briefcase, MapPin, Search, Star, Zap, Clock, Users,
  ArrowRight, ChevronRight,
} from 'lucide-react';

interface Department { id: string; name: string; slug: string; icon?: string; }
interface Job {
  id: string; title: string; slug: string; status: string;
  location: string; location_type: string; employment_type: string;
  experience_level: string; summary?: string | null;
  salary_min?: number | null; salary_max?: number | null;
  salary_currency: string; salary_period: string; show_salary: boolean;
  application_deadline?: string | null; is_featured: boolean; is_urgent: boolean;
  application_count: number; posted_at?: string | null;
  department?: Department | null;
}

const EMP_LABELS: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time',
  contract: 'Contract', internship: 'Internship', freelance: 'Freelance',
};
const LOC_LABELS: Record<string, string> = {
  onsite: 'On-site', hybrid: 'Hybrid', remote: 'Remote',
};
const EXP_LABELS: Record<string, string> = {
  entry: 'Entry', mid: 'Mid-level', senior: 'Senior',
  lead: 'Lead', executive: 'Executive',
};

function fmtSalary(job: Job) {
  if (!job.show_salary || (!job.salary_min && !job.salary_max)) return null;
  const period = job.salary_period === 'yearly' ? '/yr' : job.salary_period === 'monthly' ? '/mo' : '/hr';
  const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K`
        : String(n);
  if (job.salary_min && job.salary_max) {
    return `${job.salary_currency} ${fmt(job.salary_min)}–${fmt(job.salary_max)}${period}`;
  }
  if (job.salary_min) return `From ${job.salary_currency} ${fmt(job.salary_min)}${period}`;
  if (job.salary_max) return `Up to ${job.salary_currency} ${fmt(job.salary_max)}${period}`;
  return null;
}

function fmtDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function CareersPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
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
    if (search)         params.set('search', search);
    if (dept !== 'all') params.set('department', dept);
    if (locationType !== 'all')    params.set('location_type', locationType);
    if (employmentType !== 'all')  params.set('employment_type', employmentType);
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
  const regular  = jobs.filter((j) => !j.is_featured);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            <Briefcase className="w-3.5 h-3.5" />
            {total} Open Position{total !== 1 ? 's' : ''}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
            Build the future of<br className="hidden sm:block" /> African commerce
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join the SouthCaravan team and help connect vendors and buyers across Africa.
            We&apos;re a fast-growing team that values impact, collaboration, and growth.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="lg:w-64 shrink-0 space-y-5">
            {/* Search */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Search</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search roles..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Department */}
            {departments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Department</p>
                <div className="space-y-1">
                  <button
                    onClick={() => { setDept('all'); setPage(1); }}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${dept === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-foreground/80'}`}
                  >
                    All Departments
                  </button>
                  {departments.map((d) => (
                    <button
                      key={d.slug}
                      onClick={() => { setDept(d.slug); setPage(1); }}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${dept === d.slug ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-foreground/80'}`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Work type */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Work Type</p>
              <Select value={locationType} onValueChange={(v) => { setLocationType(v); setPage(1); }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employment type */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Employment</p>
              <Select value={employmentType} onValueChange={(v) => { setEmploymentType(v); setPage(1); }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
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

            {/* Values CTA */}
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <p className="text-sm font-semibold mb-1">Don&apos;t see your role?</p>
              <p className="text-xs text-muted-foreground mb-3">
                We&apos;re always looking for exceptional talent. Send us your resume.
              </p>
              <Button size="sm" variant="outline" className="w-full" asChild>
                <a href="mailto:careers@southcaravan.com">Get in Touch</a>
              </Button>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Results header */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {loading ? 'Loading…' : `${total} position${total !== 1 ? 's' : ''} found`}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                Loading positions…
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground/30" />
                <p className="font-medium">No positions found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or check back later.</p>
                <Button variant="outline" onClick={() => { setSearch(''); setDept('all'); setLocationType('all'); setEmploymentType('all'); }}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <>
                {/* Featured jobs */}
                {featured.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500" /> Featured Roles
                    </p>
                    {featured.map((job) => <JobCard key={job.id} job={job} featured />)}
                  </div>
                )}

                {/* Regular jobs */}
                {regular.length > 0 && (
                  <div className="space-y-3">
                    {featured.length > 0 && (
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">All Positions</p>
                    )}
                    {regular.map((job) => <JobCard key={job.id} job={job} />)}
                  </div>
                )}
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {page} / {totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, featured = false }: { job: Job; featured?: boolean }) {
  const salary = fmtSalary(job);
  const posted = fmtDate(job.posted_at);
  const deadline = job.application_deadline ? new Date(job.application_deadline) : null;
  const isExpiringSoon = deadline && (deadline.getTime() - Date.now()) < 7 * 86_400_000;

  return (
    <Link
      href={`/careers/${job.slug}`}
      className={`group block rounded-xl border bg-card transition-all hover:shadow-md hover:-translate-y-0.5 ${featured ? 'border-amber-200/60 bg-amber-50/20 dark:bg-amber-900/5' : 'border-border'}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Tag row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {featured && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                  <Star className="w-2.5 h-2.5 fill-amber-500" /> Featured
                </span>
              )}
              {job.is_urgent && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200">
                  <Zap className="w-2.5 h-2.5 fill-red-500" /> Urgent
                </span>
              )}
              {job.department && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                  {job.department.name}
                </span>
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary border border-border text-muted-foreground">
                {EMP_LABELS[job.employment_type] ?? job.employment_type}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary border border-border text-muted-foreground">
                {EXP_LABELS[job.experience_level] ?? job.experience_level}
              </span>
            </div>

            <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
              {job.title}
            </h2>

            {job.summary && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{job.summary}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {job.location} · {LOC_LABELS[job.location_type] ?? job.location_type}
              </span>
              {salary && (
                <span className="text-green-600 font-medium">{salary}</span>
              )}
              {posted && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />{posted}
                </span>
              )}
              {isExpiringSoon && deadline && (
                <span className="text-orange-600 font-medium">
                  Closes {deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
        </div>
      </div>
    </Link>
  );
}
