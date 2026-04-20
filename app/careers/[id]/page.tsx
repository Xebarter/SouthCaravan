'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Briefcase, Calendar, Check, ChevronLeft, ExternalLink,
  FileText, Loader2, MapPin, Star, Upload, Users, X, Zap,
  Clock, Share2, Linkedin, Globe, Github,
} from 'lucide-react';

interface Department { id: string; name: string; slug: string; }
interface Job {
  id: string; title: string; slug: string; status: string;
  location: string; location_type: string; employment_type: string;
  experience_level: string; summary?: string | null;
  description: string; responsibilities?: string | null;
  requirements?: string | null; nice_to_have?: string | null;
  benefits?: string | null;
  salary_min?: number | null; salary_max?: number | null;
  salary_currency: string; salary_period: string; show_salary: boolean;
  application_deadline?: string | null; application_url?: string | null;
  is_featured: boolean; is_urgent: boolean; application_count: number;
  posted_at?: string | null; department?: Department | null;
}

const EMP_LABELS: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time',
  contract: 'Contract', internship: 'Internship', freelance: 'Freelance',
};
const LOC_LABELS: Record<string, string> = {
  onsite: 'On-site', hybrid: 'Hybrid', remote: 'Remote',
};
const EXP_LABELS: Record<string, string> = {
  entry: 'Entry level', mid: 'Mid-level', senior: 'Senior',
  lead: 'Lead', executive: 'Executive',
};

function fmtSalary(job: Job) {
  if (!job.show_salary || (!job.salary_min && !job.salary_max)) return null;
  const period = job.salary_period === 'yearly' ? '/yr' : job.salary_period === 'monthly' ? '/mo' : '/hr';
  const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K`
        : String(n);
  if (job.salary_min && job.salary_max) return `${job.salary_currency} ${fmt(job.salary_min)}–${fmt(job.salary_max)}${period}`;
  if (job.salary_min) return `From ${job.salary_currency} ${fmt(job.salary_min)}${period}`;
  return `Up to ${job.salary_currency} ${fmt(job.salary_max!)}${period}`;
}

function fmtBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileField {
  key: string;
  label: string;
  required?: boolean;
  hint?: string;
}

const FILE_FIELDS: FileField[] = [
  { key: 'resume',             label: 'Resume / CV',     required: true,  hint: 'PDF, Word, or image. Max 10 MB.' },
  { key: 'cover_letter_file',  label: 'Cover Letter',    required: false, hint: 'Optional – you can also type below.' },
  { key: 'portfolio_file',     label: 'Portfolio / Work Sample', required: false },
  { key: 'certificate',        label: 'Certificate / Transcript', required: false },
];

const REFERRAL_SOURCES = [
  'LinkedIn', 'Company website', 'Job board (e.g. BrighterMonday)',
  'Employee referral', 'Social media', 'University / College', 'Other',
];

type FormStep = 'personal' | 'professional' | 'documents' | 'review';

interface FormState {
  full_name: string; email: string; phone: string; nationality: string; location: string;
  linkedin_url: string; portfolio_url: string; github_url: string;
  years_experience: string; current_company: string; current_title: string;
  expected_salary: string; start_date_availability: string;
  willing_to_relocate: boolean; requires_sponsorship: boolean;
  cover_letter: string; referral_source: string; referral_name: string;
  gdpr_consent: boolean;
}

const EMPTY_FORM: FormState = {
  full_name: '', email: '', phone: '', nationality: '', location: '',
  linkedin_url: '', portfolio_url: '', github_url: '',
  years_experience: '', current_company: '', current_title: '',
  expected_salary: '', start_date_availability: '',
  willing_to_relocate: false, requires_sponsorship: false,
  cover_letter: '', referral_source: '', referral_name: '',
  gdpr_consent: false,
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState<FormStep>('personal');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const applyRef = useRef<HTMLDivElement>(null);

  const setF = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    fetch(`/api/careers/${id}`)
      .then((r) => { if (!r.ok) throw new Error('not found'); return r.json(); })
      .then((d) => setJob(d.job))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!job) return;
    if (!form.gdpr_consent) {
      setSubmitError('Please consent to data processing to submit your application.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    const fd = new FormData();
    fd.append('job_id', job.id);
    (Object.keys(form) as (keyof FormState)[]).forEach((k) => {
      const v = form[k];
      fd.append(k, typeof v === 'boolean' ? String(v) : v);
    });
    for (const [key, file] of Object.entries(files)) {
      if (file) fd.append(key, file);
    }

    const res = await fetch('/api/careers/apply', { method: 'POST', body: fd });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setSubmitError(data.error ?? 'Failed to submit application. Please try again.');
      return;
    }
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
        <Briefcase className="w-16 h-16 text-muted-foreground/30" />
        <h1 className="text-2xl font-bold">Position not found</h1>
        <p className="text-muted-foreground">This role may have been filled or removed.</p>
        <Button asChild><Link href="/careers">Browse open roles</Link></Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Application Submitted!</h1>
          <p className="text-muted-foreground">
            Thank you for applying for <strong>{job.title}</strong>. We&apos;ve received your application
            and will be in touch if there&apos;s a match. This may take 2–4 weeks.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline"><Link href="/careers">Browse more roles</Link></Button>
          <Button asChild><Link href="/">Go home</Link></Button>
        </div>
      </div>
    );
  }

  const salary = fmtSalary(job);
  const deadline = job.application_deadline ? new Date(job.application_deadline) : null;

  const steps: { id: FormStep; label: string }[] = [
    { id: 'personal',     label: 'Personal' },
    { id: 'professional', label: 'Professional' },
    { id: 'documents',    label: 'Documents' },
    { id: 'review',       label: 'Review' },
  ];
  const stepIdx = steps.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen bg-background">
      {/* Back navigation */}
      <div className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/careers" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" /> All Positions
          </Link>
          <span className="text-border">·</span>
          <span className="text-sm font-medium truncate">{job.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Job details — left */}
          <div className="lg:col-span-3 space-y-8">
            {/* Title block */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {job.is_featured && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                    <Star className="w-2.5 h-2.5 fill-amber-500" /> Featured
                  </span>
                )}
                {job.is_urgent && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200">
                    <Zap className="w-2.5 h-2.5 fill-red-500" /> Urgent Hire
                  </span>
                )}
                {job.department && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    {job.department.name}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{job.title}</h1>

              {/* Meta pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { icon: MapPin,    label: `${job.location} · ${LOC_LABELS[job.location_type] ?? job.location_type}` },
                  { icon: Briefcase, label: EMP_LABELS[job.employment_type] ?? job.employment_type },
                  { icon: Star,      label: EXP_LABELS[job.experience_level] ?? job.experience_level },
                  ...(job.application_count > 0
                    ? [{ icon: Users, label: `${job.application_count} applicant${job.application_count !== 1 ? 's' : ''}` }]
                    : []),
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-secondary text-sm text-foreground/80">
                    <Icon className="w-3.5 h-3.5" />{label}
                  </span>
                ))}
                {salary && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-green-200 bg-green-50 text-sm text-green-700 font-medium">
                    {salary}
                  </span>
                )}
              </div>

              {deadline && (
                <div className="flex items-center gap-2 text-sm text-orange-600 font-medium">
                  <Clock className="w-4 h-4" />
                  Application deadline: {deadline.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>

            {/* Description sections */}
            {job.summary && (
              <div className="rounded-xl border border-border bg-secondary/30 p-5">
                <p className="text-base font-medium text-foreground">{job.summary}</p>
              </div>
            )}

            {job.description && (
              <Section title="About the Role">
                <div className="prose prose-sm max-w-none text-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </div>
              </Section>
            )}

            {job.responsibilities && (
              <Section title="Responsibilities">
                <div className="prose prose-sm max-w-none text-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {job.responsibilities}
                </div>
              </Section>
            )}

            {job.requirements && (
              <Section title="Requirements">
                <div className="prose prose-sm max-w-none text-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {job.requirements}
                </div>
              </Section>
            )}

            {job.nice_to_have && (
              <Section title="Nice to Have">
                <div className="prose prose-sm max-w-none text-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {job.nice_to_have}
                </div>
              </Section>
            )}

            {job.benefits && (
              <Section title="Benefits & Perks">
                <div className="prose prose-sm max-w-none text-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {job.benefits}
                </div>
              </Section>
            )}
          </div>

          {/* Application form — right */}
          <div className="lg:col-span-2" ref={applyRef}>
            <div className="sticky top-20">
              {job.application_url ? (
                /* External ATS */
                <div className="rounded-xl border border-border p-6 space-y-4">
                  <h2 className="text-lg font-semibold">Apply for this role</h2>
                  <p className="text-sm text-muted-foreground">
                    Applications for this position are handled through our external portal.
                  </p>
                  <Button className="w-full" size="lg" asChild>
                    <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                      Apply Now <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>
              ) : (
                /* Built-in application form */
                <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card overflow-hidden">
                  {/* Form header */}
                  <div className="bg-primary/5 border-b border-border px-5 py-4">
                    <h2 className="font-semibold text-base">Apply for this role</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{job.title}</p>
                  </div>

                  {/* Step progress */}
                  <div className="px-5 pt-4 pb-2">
                    <div className="flex items-center gap-1">
                      {steps.map((s, i) => (
                        <div key={s.id} className="flex items-center flex-1">
                          <button
                            type="button"
                            onClick={() => i <= stepIdx && setStep(s.id)}
                            disabled={i > stepIdx}
                            className="flex flex-col items-center gap-1 flex-1 focus:outline-none"
                          >
                            <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors
                              ${i < stepIdx ? 'bg-green-500 text-white'
                                : i === stepIdx ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary text-muted-foreground'}`}
                            >
                              {i < stepIdx ? <Check className="w-3 h-3" /> : i + 1}
                            </div>
                            <span className={`text-[9px] font-medium ${i === stepIdx ? 'text-primary' : 'text-muted-foreground'}`}>
                              {s.label}
                            </span>
                          </button>
                          {i < steps.length - 1 && (
                            <div className={`h-0.5 flex-1 mx-1 rounded ${i < stepIdx ? 'bg-green-400' : 'bg-border'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {submitError && (
                    <div className="mx-5 mb-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2">
                      {submitError}
                    </div>
                  )}

                  <div className="px-5 pb-5 space-y-4 max-h-[60vh] overflow-y-auto">
                    {/* STEP 1: Personal */}
                    {step === 'personal' && (
                      <div className="space-y-3 pt-2">
                        <FormField label="Full Name" required>
                          <Input value={form.full_name} onChange={(e) => setF('full_name', e.target.value)} placeholder="Jane Doe" required />
                        </FormField>
                        <FormField label="Email Address" required>
                          <Input type="email" value={form.email} onChange={(e) => setF('email', e.target.value)} placeholder="jane@example.com" required />
                        </FormField>
                        <FormField label="Phone Number">
                          <Input type="tel" value={form.phone} onChange={(e) => setF('phone', e.target.value)} placeholder="+254 7XX XXX XXX" />
                        </FormField>
                        <FormField label="Nationality">
                          <Input value={form.nationality} onChange={(e) => setF('nationality', e.target.value)} placeholder="Kenyan" />
                        </FormField>
                        <FormField label="Current Location">
                          <Input value={form.location} onChange={(e) => setF('location', e.target.value)} placeholder="Nairobi, Kenya" />
                        </FormField>
                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <p className="text-sm font-medium">Willing to Relocate?</p>
                          </div>
                          <Switch checked={form.willing_to_relocate} onCheckedChange={(v) => setF('willing_to_relocate', v)} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Requires Work Authorization / Sponsorship?</p>
                          </div>
                          <Switch checked={form.requires_sponsorship} onCheckedChange={(v) => setF('requires_sponsorship', v)} />
                        </div>
                      </div>
                    )}

                    {/* STEP 2: Professional */}
                    {step === 'professional' && (
                      <div className="space-y-3 pt-2">
                        <FormField label="Current / Last Job Title">
                          <Input value={form.current_title} onChange={(e) => setF('current_title', e.target.value)} placeholder="Software Engineer" />
                        </FormField>
                        <FormField label="Current / Last Company">
                          <Input value={form.current_company} onChange={(e) => setF('current_company', e.target.value)} placeholder="Acme Ltd" />
                        </FormField>
                        <FormField label="Years of Experience">
                          <Input type="number" min="0" max="50" value={form.years_experience} onChange={(e) => setF('years_experience', e.target.value)} placeholder="3" />
                        </FormField>
                        <FormField label="Expected Salary">
                          <Input value={form.expected_salary} onChange={(e) => setF('expected_salary', e.target.value)} placeholder="KES 150,000/month" />
                        </FormField>
                        <FormField label="Availability / Notice Period">
                          <Input value={form.start_date_availability} onChange={(e) => setF('start_date_availability', e.target.value)} placeholder="2 weeks / Immediately" />
                        </FormField>
                        <FormField label="LinkedIn Profile URL">
                          <Input type="url" value={form.linkedin_url} onChange={(e) => setF('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." />
                        </FormField>
                        <FormField label="Portfolio / Website URL">
                          <Input type="url" value={form.portfolio_url} onChange={(e) => setF('portfolio_url', e.target.value)} placeholder="https://yoursite.com" />
                        </FormField>
                        <FormField label="GitHub Profile URL">
                          <Input type="url" value={form.github_url} onChange={(e) => setF('github_url', e.target.value)} placeholder="https://github.com/..." />
                        </FormField>
                        <FormField label="Cover Letter">
                          <Textarea
                            value={form.cover_letter}
                            onChange={(e) => setF('cover_letter', e.target.value)}
                            placeholder="Why are you excited about this role? What makes you a great fit?..."
                            rows={5}
                          />
                        </FormField>
                        <FormField label="How did you hear about us?">
                          <Select value={form.referral_source || 'none'} onValueChange={(v) => setF('referral_source', v === 'none' ? '' : v)}>
                            <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select…</SelectItem>
                              {REFERRAL_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormField>
                        {form.referral_source === 'Employee referral' && (
                          <FormField label="Referrer's Name">
                            <Input value={form.referral_name} onChange={(e) => setF('referral_name', e.target.value)} placeholder="John Smith" />
                          </FormField>
                        )}
                      </div>
                    )}

                    {/* STEP 3: Documents */}
                    {step === 'documents' && (
                      <div className="space-y-4 pt-2">
                        <p className="text-xs text-muted-foreground">
                          Upload your documents. Accepted: PDF, Word (.docx), JPG/PNG. Max 10 MB each.
                        </p>
                        {FILE_FIELDS.map((field) => (
                          <FileUploadField
                            key={field.key}
                            field={field}
                            file={files[field.key] ?? null}
                            onChange={(f) => setFiles((prev) => ({ ...prev, [field.key]: f }))}
                          />
                        ))}
                      </div>
                    )}

                    {/* STEP 4: Review */}
                    {step === 'review' && (
                      <div className="space-y-4 pt-2">
                        <ReviewRow label="Name" value={form.full_name} />
                        <ReviewRow label="Email" value={form.email} />
                        {form.phone && <ReviewRow label="Phone" value={form.phone} />}
                        {form.location && <ReviewRow label="Location" value={form.location} />}
                        {form.current_title && <ReviewRow label="Current Title" value={form.current_title} />}
                        {form.years_experience && <ReviewRow label="Experience" value={`${form.years_experience} years`} />}
                        {form.expected_salary && <ReviewRow label="Expected Salary" value={form.expected_salary} />}
                        {form.start_date_availability && <ReviewRow label="Availability" value={form.start_date_availability} />}
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">Uploaded Documents</p>
                          {Object.entries(files).filter(([, f]) => f).map(([key, file]) => (
                            <p key={key} className="text-sm flex items-center gap-1.5 text-foreground/70">
                              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                              {file!.name} ({fmtBytes(file!.size)})
                            </p>
                          ))}
                          {!files.resume && (
                            <p className="text-sm text-destructive flex items-center gap-1.5">
                              <X className="w-3.5 h-3.5" /> Resume not uploaded
                            </p>
                          )}
                        </div>

                        <Separator />

                        <div className="space-y-3 rounded-md bg-secondary/50 border border-border p-3 text-xs text-muted-foreground">
                          <p className="font-semibold text-foreground text-sm">Data Processing Consent</p>
                          <p>
                            By submitting this application, you consent to SouthCaravan storing and processing
                            your personal data and documents for recruitment purposes for up to 2 years.
                            Your data will not be shared with third parties without your consent.
                          </p>
                          <div className="flex items-start gap-2 pt-1">
                            <Switch
                              checked={form.gdpr_consent}
                              onCheckedChange={(v) => setF('gdpr_consent', v)}
                              id="gdpr"
                            />
                            <label htmlFor="gdpr" className="text-foreground font-medium cursor-pointer">
                              I agree to the processing of my personal data for recruitment purposes. <span className="text-destructive">*</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation buttons */}
                  <div className="px-5 pb-5 flex items-center justify-between gap-2 border-t border-border pt-4">
                    {stepIdx > 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setStep(steps[stepIdx - 1].id)}
                      >
                        Back
                      </Button>
                    ) : <div />}

                    {stepIdx < steps.length - 1 ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (step === 'personal' && (!form.full_name || !form.email)) {
                            setSubmitError('Name and email are required.');
                            return;
                          }
                          setSubmitError(null);
                          setStep(steps[stepIdx + 1].id);
                        }}
                      >
                        Continue
                      </Button>
                    ) : (
                      <Button type="submit" size="sm" disabled={submitting || !form.gdpr_consent}>
                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Submit Application
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 pb-2 border-b border-border">{title}</h2>
      {children}
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

function FileUploadField({
  field, file, onChange,
}: { field: FileField; file: File | null; onChange: (f: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1">
      <Label className="text-xs">
        {field.label}
        {field.required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {file ? (
        <div className="flex items-center gap-2 p-2.5 rounded-md border border-border bg-secondary/30">
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{file.name}</p>
            <p className="text-[10px] text-muted-foreground">{fmtBytes(file.size)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onChange(null)}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-md border border-dashed border-border bg-secondary/20 hover:bg-secondary/40 transition-colors p-3 flex flex-col items-center gap-1"
        >
          <Upload className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Click to upload</span>
          {field.hint && <span className="text-[10px] text-muted-foreground/70">{field.hint}</span>}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
