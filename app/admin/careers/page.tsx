'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Briefcase, Eye, MapPin, MoreVertical, Pencil, Plus,
  Search, Star, Trash2, Users, Zap, Clock, CheckCircle2,
} from 'lucide-react';

interface Department { id: string; name: string; slug: string; icon?: string; }
interface Job {
  id: string; title: string; slug: string; status: string;
  location: string; location_type: string; employment_type: string;
  experience_level: string; is_featured: boolean; is_urgent: boolean;
  application_count: number; view_count: number;
  application_deadline?: string | null;
  posted_at?: string | null; created_at: string;
  department?: Department | null;
}

const STATUS_COLORS: Record<string, string> = {
  open:   'bg-green-500/10 text-green-600 border-green-200',
  draft:  'bg-yellow-500/10 text-yellow-600 border-yellow-200',
  paused: 'bg-blue-500/10 text-blue-600 border-blue-200',
  closed: 'bg-gray-500/10 text-gray-500 border-gray-200',
  filled: 'bg-purple-500/10 text-purple-600 border-purple-200',
};

const EMP_LABELS: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time',
  contract: 'Contract', internship: 'Internship', freelance: 'Freelance',
};

const LOC_LABELS: Record<string, string> = {
  onsite: 'On-site', hybrid: 'Hybrid', remote: 'Remote',
};

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminCareersPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const limit = 20;

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);
    try {
      const res = await fetch(`/api/admin/careers?${params}`);
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  async function toggleStatus(job: Job) {
    const newStatus = job.status === 'open' ? 'draft' : 'open';
    setActionLoading(job.id);
    await fetch('/api/admin/careers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: job.id, status: newStatus }),
    });
    await fetchJobs();
    setActionLoading(null);
  }

  async function toggleFeatured(job: Job) {
    setActionLoading(job.id);
    await fetch('/api/admin/careers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: job.id, is_featured: !job.is_featured }),
    });
    await fetchJobs();
    setActionLoading(null);
  }

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/admin/careers?id=${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    await fetchJobs();
  }

  const totalPages = Math.ceil(total / limit);
  const stats = {
    total,
    open:   jobs.filter((j) => j.status === 'open').length,
    draft:  jobs.filter((j) => j.status === 'draft').length,
    apps:   jobs.reduce((s, j) => s + j.application_count, 0),
  };

  return (
    <main>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Careers Management</h1>
            <p className="text-muted-foreground mt-1">Create, manage, and track job listings and applications</p>
          </div>
          <Button asChild>
            <Link href="/admin/careers/new">
              <Plus className="w-4 h-4 mr-2" />
              New Job Listing
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Listings', value: total,       icon: Briefcase,    color: 'text-blue-600' },
            { label: 'Open Positions', value: stats.open,  icon: CheckCircle2, color: 'text-green-600' },
            { label: 'Drafts',         value: stats.draft, icon: Clock,        color: 'text-yellow-600' },
            { label: 'Applications',   value: stats.apps,  icon: Users,        color: 'text-purple-600' },
          ].map((s) => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                  <s.icon className={`w-5 h-5 ${s.color} opacity-70`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search job titles, locations..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="filled">Filled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Jobs table */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Job Listings</CardTitle>
            <CardDescription>{total} total</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                Loading jobs…
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Briefcase className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No job listings found.</p>
                <Button asChild size="sm">
                  <Link href="/admin/careers/new">Create your first listing</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[job.status] ?? ''}`}>
                          {job.status}
                        </span>
                        {job.is_featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                            <Star className="w-2.5 h-2.5 fill-amber-500" /> Featured
                          </span>
                        )}
                        {job.is_urgent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
                            <Zap className="w-2.5 h-2.5 fill-red-500" /> Urgent
                          </span>
                        )}
                        {job.department && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary border border-border">
                            {job.department.name}
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary border border-border">
                          {EMP_LABELS[job.employment_type] ?? job.employment_type}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary border border-border">
                          {LOC_LABELS[job.location_type] ?? job.location_type}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-foreground leading-snug">{job.title}</h3>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />{job.application_count} applications
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />{job.view_count} views
                        </span>
                        <span>Posted {fmtDate(job.posted_at ?? job.created_at)}</span>
                        {job.application_deadline && (
                          <span className="text-orange-600">
                            Deadline: {fmtDate(job.application_deadline)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs hidden sm:flex"
                        asChild
                      >
                        <Link href={`/admin/careers/${job.id}/applications`}>
                          <Users className="w-3 h-3 mr-1" />
                          {job.application_count}
                        </Link>
                      </Button>

                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                        <Link href={`/careers/${job.slug}`} target="_blank" title="View live listing">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </Button>

                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                        <Link href={`/admin/careers/${job.id}/edit`} title="Edit listing">
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/admin/careers/${job.id}/edit`)}>
                            <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/admin/careers/${job.id}/applications`)}>
                            <Users className="w-3.5 h-3.5 mr-2" /> View Applications
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={actionLoading === job.id}
                            onClick={() => toggleStatus(job)}
                          >
                            {job.status === 'open' ? 'Set to Draft' : 'Publish (Open)'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={actionLoading === job.id}
                            onClick={() => toggleFeatured(job)}
                          >
                            <Star className="w-3.5 h-3.5 mr-2" />
                            {job.is_featured ? 'Remove Featured' : 'Mark Featured'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteId(job.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete job listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the listing and all its applications. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
