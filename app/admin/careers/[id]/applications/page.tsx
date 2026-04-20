'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, Download, ExternalLink, FileText, Loader2,
  Mail, MapPin, Phone, Search, Star, User, Linkedin,
  Github, Globe, Calendar, Briefcase, ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Document {
  id: string; document_type: string; label?: string;
  file_name: string; file_size: number; mime_type?: string;
  signed_url?: string | null; created_at: string;
}

interface Application {
  id: string; full_name: string; email: string; phone?: string | null;
  nationality?: string | null; location?: string | null;
  linkedin_url?: string | null; portfolio_url?: string | null; github_url?: string | null;
  years_experience?: number | null; current_company?: string | null; current_title?: string | null;
  expected_salary?: string | null; start_date_availability?: string | null;
  willing_to_relocate?: boolean | null; requires_sponsorship?: boolean | null;
  cover_letter?: string | null; referral_source?: string | null;
  status: string; internal_rating?: number | null; internal_notes?: string | null;
  rejection_reason?: string | null; reviewed_at?: string | null;
  created_at: string; documents?: Document[];
  job?: { id: string; title: string; slug: string; } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending:             'bg-gray-500/10 text-gray-600 border-gray-200',
  reviewing:           'bg-blue-500/10 text-blue-600 border-blue-200',
  shortlisted:         'bg-cyan-500/10 text-cyan-600 border-cyan-200',
  interview_scheduled: 'bg-purple-500/10 text-purple-600 border-purple-200',
  interviewed:         'bg-violet-500/10 text-violet-600 border-violet-200',
  offer_extended:      'bg-amber-500/10 text-amber-600 border-amber-200',
  offer_accepted:      'bg-green-500/10 text-green-600 border-green-200',
  offer_declined:      'bg-orange-500/10 text-orange-600 border-orange-200',
  rejected:            'bg-red-500/10 text-red-600 border-red-200',
  withdrawn:           'bg-slate-500/10 text-slate-500 border-slate-200',
};

const STATUS_OPTIONS = [
  { value: 'pending',             label: 'Pending' },
  { value: 'reviewing',           label: 'Reviewing' },
  { value: 'shortlisted',         label: 'Shortlisted' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'interviewed',         label: 'Interviewed' },
  { value: 'offer_extended',      label: 'Offer Extended' },
  { value: 'offer_accepted',      label: 'Offer Accepted' },
  { value: 'offer_declined',      label: 'Offer Declined' },
  { value: 'rejected',            label: 'Rejected' },
  { value: 'withdrawn',           label: 'Withdrawn' },
];

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ApplicationsPage() {
  const { id: jobId } = useParams<{ id: string }>();
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Application | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [editStatus, setEditStatus] = useState('');
  const [editRejectionReason, setEditRejectionReason] = useState('');

  const limit = 20;

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ job_id: jobId, page: String(page), limit: String(limit) });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);
    try {
      const res = await fetch(`/api/admin/careers/applications?${params}`);
      const data = await res.json();
      setApplications(data.applications ?? []);
      setTotal(data.total ?? 0);
      if (data.applications?.[0]?.job?.title) setJobTitle(data.applications[0].job.title);
    } finally {
      setLoading(false);
    }
  }, [jobId, page, statusFilter, search]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  // Load job title if no applications yet
  useEffect(() => {
    if (!jobTitle) {
      fetch(`/api/admin/careers/${jobId}`)
        .then((r) => r.json())
        .then((d) => { if (d.job?.title) setJobTitle(d.job.title); })
        .catch(() => {});
    }
  }, [jobId, jobTitle]);

  async function openDetail(app: Application) {
    setDetailLoading(true);
    setSelected(null);
    const res = await fetch(`/api/admin/careers/applications/${app.id}`);
    const data = await res.json();
    setDetailLoading(false);
    if (data.application) {
      const a = data.application as Application;
      setSelected(a);
      setEditStatus(a.status);
      setEditNotes(a.internal_notes ?? '');
      setEditRating(a.internal_rating ?? 0);
      setEditRejectionReason(a.rejection_reason ?? '');
    }
  }

  async function saveReview() {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/api/admin/careers/applications/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: editStatus,
        internal_notes: editNotes || null,
        internal_rating: editRating || null,
        rejection_reason: editRejectionReason || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSelected(null);
      await fetchApplications();
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <main>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/careers')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <p className="text-xs text-muted-foreground">Job Listing</p>
              <h1 className="text-2xl font-bold">{jobTitle || 'Applications'}</h1>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/admin/careers/${jobId}/edit`}>
              Edit Listing
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {STATUS_OPTIONS.slice(0, 5).map((s) => {
            const count = applications.filter((a) => a.status === s.value).length;
            return (
              <Card key={s.value} className="border-border/50">
                <CardContent className="pt-3 pb-3">
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search applicants..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applications list */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Applications</CardTitle>
            <CardDescription>{total} total</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                Loading applications…
              </div>
            ) : applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <User className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No applications yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors cursor-pointer"
                    onClick={() => openDetail(app)}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                      {app.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[app.status] ?? ''}`}>
                          {STATUS_OPTIONS.find((s) => s.value === app.status)?.label ?? app.status}
                        </span>
                        {app.internal_rating != null && (
                          <span className="flex items-center gap-0.5 text-amber-500 text-[11px]">
                            {Array.from({ length: app.internal_rating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-500" />
                            ))}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold">{app.full_name}</p>
                      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{app.email}</span>
                        {app.current_title && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{app.current_title}{app.current_company ? ` at ${app.current_company}` : ''}</span>}
                        {app.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.location}</span>}
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Applied {fmtDate(app.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={(e) => e.stopPropagation()}>
                            {STATUS_OPTIONS.find((s) => s.value === app.status)?.label ?? app.status}
                            <ChevronDown className="w-3 h-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {STATUS_OPTIONS.map((s) => (
                            <DropdownMenuItem
                              key={s.value}
                              onClick={async (e) => {
                                e.stopPropagation();
                                await fetch(`/api/admin/careers/applications/${app.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: s.value }),
                                });
                                await fetchApplications();
                              }}
                            >
                              {s.label}
                            </DropdownMenuItem>
                          ))}
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
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Applicant detail drawer */}
      <Dialog open={!!selected || detailLoading} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">{selected.full_name}</DialogTitle>
                <DialogDescription>
                  Applied {fmtDate(selected.created_at)}
                  {selected.referral_source && ` · via ${selected.referral_source}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                {/* Contact */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <Mail className="w-4 h-4 shrink-0" /><span className="truncate">{selected.email}</span>
                  </a>
                  {selected.phone && (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4 shrink-0" />{selected.phone}
                    </span>
                  )}
                  {selected.location && (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 shrink-0" />{selected.location}
                    </span>
                  )}
                  {selected.linkedin_url && (
                    <a href={selected.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                      <Linkedin className="w-4 h-4 shrink-0" /> LinkedIn
                    </a>
                  )}
                  {selected.github_url && (
                    <a href={selected.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                      <Github className="w-4 h-4 shrink-0" /> GitHub
                    </a>
                  )}
                  {selected.portfolio_url && (
                    <a href={selected.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                      <Globe className="w-4 h-4 shrink-0" /> Portfolio
                    </a>
                  )}
                </div>

                {/* Professional */}
                <div className="rounded-md bg-secondary/50 border border-border p-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                  {selected.current_title && <div><span className="text-muted-foreground text-xs">Current Title</span><p className="font-medium">{selected.current_title}</p></div>}
                  {selected.current_company && <div><span className="text-muted-foreground text-xs">Company</span><p className="font-medium">{selected.current_company}</p></div>}
                  {selected.years_experience != null && <div><span className="text-muted-foreground text-xs">Experience</span><p className="font-medium">{selected.years_experience} yrs</p></div>}
                  {selected.expected_salary && <div><span className="text-muted-foreground text-xs">Expected Salary</span><p className="font-medium">{selected.expected_salary}</p></div>}
                  {selected.start_date_availability && <div><span className="text-muted-foreground text-xs">Start Date</span><p className="font-medium">{selected.start_date_availability}</p></div>}
                  {selected.nationality && <div><span className="text-muted-foreground text-xs">Nationality</span><p className="font-medium">{selected.nationality}</p></div>}
                  {selected.willing_to_relocate != null && <div><span className="text-muted-foreground text-xs">Willing to Relocate</span><p className="font-medium">{selected.willing_to_relocate ? 'Yes' : 'No'}</p></div>}
                  {selected.requires_sponsorship != null && <div><span className="text-muted-foreground text-xs">Needs Sponsorship</span><p className="font-medium">{selected.requires_sponsorship ? 'Yes' : 'No'}</p></div>}
                </div>

                {/* Cover letter */}
                {selected.cover_letter && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Cover Letter</p>
                    <div className="text-sm text-foreground/80 whitespace-pre-wrap rounded-md border border-border p-3 bg-secondary/20 max-h-40 overflow-y-auto">
                      {selected.cover_letter}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {selected.documents && selected.documents.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Documents</p>
                    <div className="space-y-2">
                      {selected.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-md border border-border bg-secondary/20">
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.label ?? doc.document_type}</p>
                            <p className="text-[11px] text-muted-foreground">{doc.file_name} · {fmtBytes(doc.file_size)}</p>
                          </div>
                          {doc.signed_url && (
                            <a
                              href={doc.signed_url}
                              download={doc.file_name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0"
                            >
                              <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin review */}
                <div className="border-t border-border pt-4 space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Review</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <Select value={editStatus} onValueChange={setEditStatus}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Rating (1–5)</Label>
                      <div className="flex items-center gap-1 h-9">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setEditRating(editRating === n ? 0 : n)}
                            className="focus:outline-none"
                          >
                            <Star className={`w-5 h-5 ${n <= editRating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Internal Notes</Label>
                    <Textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Notes visible only to hiring team..."
                      rows={3}
                    />
                  </div>

                  {(editStatus === 'rejected') && (
                    <div className="space-y-1.5">
                      <Label>Rejection Reason</Label>
                      <Textarea
                        value={editRejectionReason}
                        onChange={(e) => setEditRejectionReason(e.target.value)}
                        placeholder="Brief reason for rejection..."
                        rows={2}
                      />
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
                    <Button onClick={saveReview} disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Review
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}
