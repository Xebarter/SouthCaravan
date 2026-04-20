'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

interface Department { id: string; name: string; slug: string; }

interface JobFormData {
  id?: string;
  title: string;
  slug: string;
  department_id: string;
  location: string;
  location_type: string;
  employment_type: string;
  experience_level: string;
  summary: string;
  description: string;
  responsibilities: string;
  requirements: string;
  nice_to_have: string;
  benefits: string;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  salary_period: string;
  show_salary: boolean;
  application_deadline: string;
  application_email: string;
  application_url: string;
  max_applications: string;
  status: string;
  is_featured: boolean;
  is_urgent: boolean;
  meta_title: string;
  meta_description: string;
}

const EMPTY: JobFormData = {
  title: '', slug: '', department_id: '', location: 'Nairobi, Kenya',
  location_type: 'onsite', employment_type: 'full_time', experience_level: 'mid',
  summary: '', description: '', responsibilities: '', requirements: '',
  nice_to_have: '', benefits: '',
  salary_min: '', salary_max: '', salary_currency: 'KES', salary_period: 'yearly',
  show_salary: false, application_deadline: '', application_email: '',
  application_url: '', max_applications: '',
  status: 'draft', is_featured: false, is_urgent: false,
  meta_title: '', meta_description: '',
};

function slugify(text: string) {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

export function JobForm({ mode, initialData }: {
  mode: 'new' | 'edit';
  initialData?: Partial<JobFormData> & { id?: string };
}) {
  const router = useRouter();
  const [form, setForm] = useState<JobFormData>({ ...EMPTY, ...initialData });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(mode === 'edit');

  useEffect(() => {
    fetch('/api/admin/careers?limit=1&page=1')
      .then((r) => r.json())
      .then(() => {})
      .catch(() => {});
    // Load departments via direct query (reuse the jobs list page won't return depts; use a separate endpoint or the public API)
    fetch('/api/careers?limit=1')
      .then((r) => r.json())
      .then((d) => setDepartments(d.departments ?? []))
      .catch(() => {});
  }, []);

  const set = <K extends keyof JobFormData>(key: K, val: JobFormData[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  function handleTitleChange(v: string) {
    set('title', v);
    if (!slugManual) set('slug', slugify(v));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      ...form,
      salary_min: form.salary_min ? Number(form.salary_min) : null,
      salary_max: form.salary_max ? Number(form.salary_max) : null,
      max_applications: form.max_applications ? Number(form.max_applications) : null,
      department_id: form.department_id || null,
      application_deadline: form.application_deadline || null,
    };

    let res: Response;
    if (mode === 'new') {
      res = await fetch('/api/admin/careers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch('/api/admin/careers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, id: initialData?.id }),
      });
    }

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.');
      return;
    }

    router.push('/admin/careers');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{mode === 'new' ? 'New Job Listing' : 'Edit Job Listing'}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {mode === 'new' ? 'Create a new career opportunity' : 'Update this job listing'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={form.status} onValueChange={(v) => set('status', v)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="filled">Filled</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {mode === 'new' ? 'Create Listing' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Job Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => { setSlugManual(true); set('slug', slugify(e.target.value)); }}
                  placeholder="senior-software-engineer"
                />
                <p className="text-xs text-muted-foreground">careers/{form.slug || 'your-slug'}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="summary">Short Summary</Label>
                <Textarea
                  id="summary"
                  value={form.summary}
                  onChange={(e) => set('summary', e.target.value)}
                  placeholder="One or two sentences describing this role..."
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Full Job Description <span className="text-destructive">*</span></Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Describe the role, team, and impact..."
                  rows={8}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Role Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Responsibilities</Label>
                <Textarea
                  value={form.responsibilities}
                  onChange={(e) => set('responsibilities', e.target.value)}
                  placeholder="• Lead the design and development of...&#10;• Collaborate with cross-functional teams..."
                  rows={6}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Requirements</Label>
                <Textarea
                  value={form.requirements}
                  onChange={(e) => set('requirements', e.target.value)}
                  placeholder="• 3+ years of experience in...&#10;• Proficiency in..."
                  rows={6}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nice to Have</Label>
                <Textarea
                  value={form.nice_to_have}
                  onChange={(e) => set('nice_to_have', e.target.value)}
                  placeholder="• Experience with...&#10;• Familiarity with..."
                  rows={4}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Benefits & Perks</Label>
                <Textarea
                  value={form.benefits}
                  onChange={(e) => set('benefits', e.target.value)}
                  placeholder="• Competitive salary&#10;• Health insurance&#10;• Remote-friendly..."
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Meta Title</Label>
                <Input
                  value={form.meta_title}
                  onChange={(e) => set('meta_title', e.target.value)}
                  placeholder={form.title || 'Leave blank to use job title'}
                  maxLength={60}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Meta Description</Label>
                <Textarea
                  value={form.meta_description}
                  onChange={(e) => set('meta_description', e.target.value)}
                  placeholder="Short description for search engines..."
                  rows={3}
                  maxLength={160}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-6">
          {/* Classification */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={form.department_id || 'none'} onValueChange={(v) => set('department_id', v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No department</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Employment Type</Label>
                <Select value={form.employment_type} onValueChange={(v) => set('employment_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full-time</SelectItem>
                    <SelectItem value="part_time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Experience Level</Label>
                <Select value={form.experience_level} onValueChange={(v) => set('experience_level', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry level</SelectItem>
                    <SelectItem value="mid">Mid level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="lead">Lead / Principal</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Location Type</Label>
                <Select value={form.location_type} onValueChange={(v) => set('location_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onsite">On-site</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                  placeholder="Nairobi, Kenya"
                />
              </div>
            </CardContent>
          </Card>

          {/* Compensation */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Compensation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Min Salary</Label>
                  <Input
                    type="number"
                    value={form.salary_min}
                    onChange={(e) => set('salary_min', e.target.value)}
                    placeholder="50000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Salary</Label>
                  <Input
                    type="number"
                    value={form.salary_max}
                    onChange={(e) => set('salary_max', e.target.value)}
                    placeholder="100000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select value={form.salary_currency} onValueChange={(v) => set('salary_currency', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="ZAR">ZAR</SelectItem>
                      <SelectItem value="NGN">NGN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Period</Label>
                  <Select value={form.salary_period} onValueChange={(v) => set('salary_period', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Per hour</SelectItem>
                      <SelectItem value="monthly">Per month</SelectItem>
                      <SelectItem value="yearly">Per year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-salary" className="text-sm font-normal">Show salary to applicants</Label>
                <Switch
                  id="show-salary"
                  checked={form.show_salary}
                  onCheckedChange={(v) => set('show_salary', v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Application settings */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Application Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Application Deadline</Label>
                <Input
                  type="datetime-local"
                  value={form.application_deadline}
                  onChange={(e) => set('application_deadline', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max Applications</Label>
                <Input
                  type="number"
                  value={form.max_applications}
                  onChange={(e) => set('max_applications', e.target.value)}
                  placeholder="Leave blank for unlimited"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Application Email Override</Label>
                <Input
                  type="email"
                  value={form.application_email}
                  onChange={(e) => set('application_email', e.target.value)}
                  placeholder="hr@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>External Application URL</Label>
                <Input
                  type="url"
                  value={form.application_url}
                  onChange={(e) => set('application_url', e.target.value)}
                  placeholder="https://ats.example.com/apply/..."
                />
                <p className="text-xs text-muted-foreground">If set, applicants will be redirected here instead of using the built-in form.</p>
              </div>
            </CardContent>
          </Card>

          {/* Visibility */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Featured</p>
                  <p className="text-xs text-muted-foreground">Highlight at the top of the careers page</p>
                </div>
                <Switch checked={form.is_featured} onCheckedChange={(v) => set('is_featured', v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Urgent Hire</p>
                  <p className="text-xs text-muted-foreground">Show urgent badge on the listing</p>
                </div>
                <Switch checked={form.is_urgent} onCheckedChange={(v) => set('is_urgent', v)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
