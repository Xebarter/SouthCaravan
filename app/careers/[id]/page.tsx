'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { JobDetailSection } from '@/components/careers/job-detail-section';
import type { CareerJob } from '@/components/careers/shared';
import {
  EMP_LABELS, EXP_LABELS, fmtSalary, LOC_LABELS,
} from '@/components/careers/shared';
import {
  Briefcase, Check, ChevronLeft, ExternalLink,
  FileText, Loader2, MapPin, Star, Upload, Users, X, Zap,
  Clock, Share2, ArrowDown,
} from 'lucide-react';

interface Job extends CareerJob {
  description: string;
  responsibilities?: string | null;
  requirements?: string | null;
  nice_to_have?: string | null;
  benefits?: string | null;
  application_url?: string | null;
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
  { key: 'resume', label: 'Resume / CV', required: true, hint: 'PDF, Word, or image. Max 10 MB.' },
  { key: 'cover_letter_file', label: 'Cover Letter', required: false, hint: 'Optional – you can also type below.' },
  { key: 'portfolio_file', label: 'Portfolio / Work Sample', required: false },
  { key: 'certificate', label: 'Certificate / Transcript', required: false },
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

const STEPS: { id: FormStep; label: string }[] = [
  { id: 'personal', label: 'Personal' },
  { id: 'professional', label: 'Experience' },
  { id: 'documents', label: 'Documents' },
  { id: 'review', label: 'Review' },
];

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
  const [shareDone, setShareDone] = useState(false);
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

  const scrollToApply = useCallback(() => {
    applyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  async function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = job?.title ?? 'South Caravan Careers';
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareDone(true);
      setTimeout(() => setShareDone(false), 2000);
    } catch {
      /* user cancelled */
    }
  }

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
    return <JobDetailSkeleton />;
  }

  if (notFound || !job) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-20">
        <Card className="max-w-md w-full rounded-2xl text-center shadow-lg">
          <CardContent className="pt-12 pb-10 px-8">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Briefcase className="h-8 w-8 text-muted-foreground/40" />
            </span>
            <h1 className="mt-6 text-2xl font-extrabold">Position not found</h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              This role may have been filled, closed, or removed from our listings.
            </p>
            <Button asChild className="mt-8 rounded-lg">
              <Link href="/careers">Browse open roles</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-20">
        <Card className="max-w-lg w-full rounded-2xl text-center shadow-lg overflow-hidden">
          <div className="h-2 bg-linear-to-r from-emerald-400 to-primary" aria-hidden />
          <CardContent className="pt-12 pb-10 px-8">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-8 w-8 text-emerald-600" />
            </span>
            <h1 className="mt-6 text-2xl font-extrabold">Application submitted</h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Thank you for applying for <strong className="text-foreground">{job.title}</strong>.
              Our team will review your application and respond if there&apos;s a match — typically within 2–4 weeks.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline" className="rounded-lg">
                <Link href="/careers">Browse more roles</Link>
              </Button>
              <Button asChild className="rounded-lg">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const salary = fmtSalary(job);
  const deadline = job.application_deadline ? new Date(job.application_deadline) : null;
  const stepIdx = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Top bar */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href="/careers"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
            All roles
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <Button type="button" variant="outline" size="sm" className="rounded-lg gap-1.5 shrink-0" onClick={handleShare}>
              <Share2 className="h-3.5 w-3.5" />
              {shareDone ? 'Copied!' : 'Share'}
            </Button>
            {!job.application_url && (
              <Button size="sm" className="rounded-lg lg:hidden shrink-0" onClick={scrollToApply}>
                Apply
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Role hero */}
      <section
        className="border-b border-border"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #0f172a 100%)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {job.is_featured && (
              <Badge className="gap-1 bg-amber-500/20 text-amber-200 border-amber-400/30 hover:bg-amber-500/20">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                Featured
              </Badge>
            )}
            {job.is_urgent && (
              <Badge className="gap-1 bg-red-500/20 text-red-200 border-red-400/30 hover:bg-red-500/20">
                <Zap className="h-3 w-3 fill-red-400" />
                Urgent hire
              </Badge>
            )}
            {job.department && (
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                {job.department.name}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight max-w-3xl">
            {job.title}
          </h1>

          <div className="mt-5 flex flex-wrap gap-2">
            <MetaPill icon={MapPin} label={`${job.location} · ${LOC_LABELS[job.location_type] ?? job.location_type}`} />
            <MetaPill icon={Briefcase} label={EMP_LABELS[job.employment_type] ?? job.employment_type} />
            <MetaPill icon={Star} label={EXP_LABELS[job.experience_level] ?? job.experience_level} />
            {job.application_count > 0 && (
              <MetaPill icon={Users} label={`${job.application_count} applicant${job.application_count !== 1 ? 's' : ''}`} />
            )}
            {salary && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-sm font-semibold text-emerald-200">
                {salary}
              </span>
            )}
          </div>

          {deadline && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-amber-200/90">
              <Clock className="h-4 w-4" />
              Apply by {deadline.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}

          {job.summary && (
            <p className="mt-6 text-sm sm:text-base text-white/75 leading-relaxed max-w-3xl border-l-2 border-primary/60 pl-4">
              {job.summary}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Job content */}
          <div className="lg:col-span-3 space-y-5">
            {job.description && (
              <JobDetailSection title="About the role">{job.description}</JobDetailSection>
            )}
            {job.responsibilities && (
              <JobDetailSection title="Responsibilities" accent="bg-sky-500">
                {job.responsibilities}
              </JobDetailSection>
            )}
            {job.requirements && (
              <JobDetailSection title="Requirements" accent="bg-violet-500">
                {job.requirements}
              </JobDetailSection>
            )}
            {job.nice_to_have && (
              <JobDetailSection title="Nice to have" accent="bg-amber-500">
                {job.nice_to_have}
              </JobDetailSection>
            )}
            {job.benefits && (
              <JobDetailSection title="Benefits & perks" accent="bg-emerald-500">
                {job.benefits}
              </JobDetailSection>
            )}
          </div>

          {/* Application */}
          <div className="lg:col-span-2" ref={applyRef}>
            <div className="lg:sticky lg:top-20">
              {job.application_url ? (
                <Card className="rounded-2xl shadow-lg border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Apply for this role</CardTitle>
                    <p className="text-sm text-muted-foreground font-normal">
                      Applications are handled through our external hiring portal.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full rounded-xl h-11" size="lg" asChild>
                      <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                        Apply now
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <form onSubmit={handleSubmit}>
                  <Card className="rounded-2xl shadow-lg border-border overflow-hidden">
                    <div className="bg-linear-to-r from-primary/10 via-primary/5 to-transparent border-b border-border px-5 py-4">
                      <h2 className="font-bold text-base">Apply for this role</h2>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{job.title}</p>
                    </div>

                    {/* Stepper */}
                    <div className="px-5 pt-5 pb-2">
                      <div className="flex items-center">
                        {STEPS.map((s, i) => (
                          <div key={s.id} className="flex items-center flex-1 last:flex-none">
                            <button
                              type="button"
                              onClick={() => i <= stepIdx && setStep(s.id)}
                              disabled={i > stepIdx}
                              className="flex flex-col items-center gap-1 min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md disabled:opacity-60"
                            >
                              <span
                                className={[
                                  'h-7 w-7 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors',
                                  i < stepIdx ? 'bg-emerald-500 text-white'
                                    : i === stepIdx ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground',
                                ].join(' ')}
                              >
                                {i < stepIdx ? <Check className="h-3.5 w-3.5" /> : i + 1}
                              </span>
                              <span className={`text-[9px] font-semibold truncate max-w-[4rem] ${i === stepIdx ? 'text-primary' : 'text-muted-foreground'}`}>
                                {s.label}
                              </span>
                            </button>
                            {i < STEPS.length - 1 && (
                              <div className={`h-0.5 flex-1 mx-1 rounded-full min-w-[8px] ${i < stepIdx ? 'bg-emerald-400' : 'bg-border'}`} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {submitError && (
                      <div className="mx-5 mb-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2.5">
                        {submitError}
                      </div>
                    )}

                    <CardContent className="px-5 pb-5 space-y-4 max-h-[min(58vh,520px)] overflow-y-auto">
                      {step === 'personal' && (
                        <div className="space-y-3 pt-1">
                          <FormField label="Full name" required>
                            <Input value={form.full_name} onChange={(e) => setF('full_name', e.target.value)} placeholder="Jane Doe" required className="rounded-lg" />
                          </FormField>
                          <FormField label="Email address" required>
                            <Input type="email" value={form.email} onChange={(e) => setF('email', e.target.value)} placeholder="jane@example.com" required className="rounded-lg" />
                          </FormField>
                          <FormField label="Phone number">
                            <Input type="tel" value={form.phone} onChange={(e) => setF('phone', e.target.value)} placeholder="+256 7XX XXX XXX" className="rounded-lg" />
                          </FormField>
                          <FormField label="Nationality">
                            <Input value={form.nationality} onChange={(e) => setF('nationality', e.target.value)} placeholder="Ugandan" className="rounded-lg" />
                          </FormField>
                          <FormField label="Current location">
                            <Input value={form.location} onChange={(e) => setF('location', e.target.value)} placeholder="Kampala, Uganda" className="rounded-lg" />
                          </FormField>
                          <ToggleRow label="Willing to relocate?" checked={form.willing_to_relocate} onChange={(v) => setF('willing_to_relocate', v)} />
                          <ToggleRow label="Requires work authorization / sponsorship?" checked={form.requires_sponsorship} onChange={(v) => setF('requires_sponsorship', v)} />
                        </div>
                      )}

                      {step === 'professional' && (
                        <div className="space-y-3 pt-1">
                          <FormField label="Current / last job title">
                            <Input value={form.current_title} onChange={(e) => setF('current_title', e.target.value)} placeholder="Software Engineer" className="rounded-lg" />
                          </FormField>
                          <FormField label="Current / last company">
                            <Input value={form.current_company} onChange={(e) => setF('current_company', e.target.value)} placeholder="Acme Ltd" className="rounded-lg" />
                          </FormField>
                          <FormField label="Years of experience">
                            <Input type="number" min="0" max="50" value={form.years_experience} onChange={(e) => setF('years_experience', e.target.value)} placeholder="3" className="rounded-lg" />
                          </FormField>
                          <FormField label="Expected salary">
                            <Input value={form.expected_salary} onChange={(e) => setF('expected_salary', e.target.value)} placeholder="UGX 3,000,000/month" className="rounded-lg" />
                          </FormField>
                          <FormField label="Availability / notice period">
                            <Input value={form.start_date_availability} onChange={(e) => setF('start_date_availability', e.target.value)} placeholder="2 weeks / Immediately" className="rounded-lg" />
                          </FormField>
                          <FormField label="LinkedIn profile">
                            <Input type="url" value={form.linkedin_url} onChange={(e) => setF('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." className="rounded-lg" />
                          </FormField>
                          <FormField label="Portfolio / website">
                            <Input type="url" value={form.portfolio_url} onChange={(e) => setF('portfolio_url', e.target.value)} placeholder="https://yoursite.com" className="rounded-lg" />
                          </FormField>
                          <FormField label="GitHub profile">
                            <Input type="url" value={form.github_url} onChange={(e) => setF('github_url', e.target.value)} placeholder="https://github.com/..." className="rounded-lg" />
                          </FormField>
                          <FormField label="Cover letter">
                            <Textarea
                              value={form.cover_letter}
                              onChange={(e) => setF('cover_letter', e.target.value)}
                              placeholder="Why are you excited about this role?"
                              rows={5}
                              className="rounded-lg resize-y"
                            />
                          </FormField>
                          <FormField label="How did you hear about us?">
                            <Select value={form.referral_source || 'none'} onValueChange={(v) => setF('referral_source', v === 'none' ? '' : v)}>
                              <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select source" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Select…</SelectItem>
                                {REFERRAL_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormField>
                          {form.referral_source === 'Employee referral' && (
                            <FormField label="Referrer's name">
                              <Input value={form.referral_name} onChange={(e) => setF('referral_name', e.target.value)} placeholder="John Smith" className="rounded-lg" />
                            </FormField>
                          )}
                        </div>
                      )}

                      {step === 'documents' && (
                        <div className="space-y-4 pt-1">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            PDF, Word (.docx), or images. Max 10 MB per file.
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

                      {step === 'review' && (
                        <div className="space-y-4 pt-1">
                          <ReviewRow label="Name" value={form.full_name} />
                          <ReviewRow label="Email" value={form.email} />
                          {form.phone && <ReviewRow label="Phone" value={form.phone} />}
                          {form.location && <ReviewRow label="Location" value={form.location} />}
                          {form.current_title && <ReviewRow label="Title" value={form.current_title} />}
                          {form.years_experience && <ReviewRow label="Experience" value={`${form.years_experience} years`} />}
                          {form.expected_salary && <ReviewRow label="Expected salary" value={form.expected_salary} />}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Documents</p>
                            {Object.entries(files).filter(([, f]) => f).map(([key, file]) => (
                              <p key={key} className="text-sm flex items-center gap-1.5 text-foreground/80">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                {file!.name} ({fmtBytes(file!.size)})
                              </p>
                            ))}
                            {!files.resume && (
                              <p className="text-sm text-destructive flex items-center gap-1.5">
                                <X className="h-3.5 w-3.5" /> Resume required — go back to Documents
                              </p>
                            )}
                          </div>
                          <Separator />
                          <div className="rounded-xl bg-muted/40 border border-border p-4 text-xs text-muted-foreground space-y-2">
                            <p className="font-semibold text-foreground text-sm">Data processing consent</p>
                            <p className="leading-relaxed">
                              By submitting, you consent to South Caravan storing your data for recruitment for up to 2 years.
                            </p>
                            <div className="flex items-start gap-3 pt-1">
                              <Switch checked={form.gdpr_consent} onCheckedChange={(v) => setF('gdpr_consent', v)} id="gdpr" />
                              <label htmlFor="gdpr" className="text-foreground font-medium cursor-pointer leading-snug">
                                I agree to processing my personal data for recruitment. <span className="text-destructive">*</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>

                    <div className="px-5 pb-5 flex items-center justify-between gap-2 border-t border-border pt-4 bg-muted/20">
                      {stepIdx > 0 ? (
                        <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => setStep(STEPS[stepIdx - 1].id)}>
                          Back
                        </Button>
                      ) : <div />}

                      {stepIdx < STEPS.length - 1 ? (
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => {
                            if (step === 'personal' && (!form.full_name || !form.email)) {
                              setSubmitError('Name and email are required.');
                              return;
                            }
                            setSubmitError(null);
                            setStep(STEPS[stepIdx + 1].id);
                          }}
                        >
                          Continue
                        </Button>
                      ) : (
                        <Button type="submit" size="sm" className="rounded-lg" disabled={submitting || !form.gdpr_consent}>
                          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Submit application
                        </Button>
                      )}
                    </div>
                  </Card>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky apply */}
      {!job.application_url && (
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur p-3 lg:hidden">
          <Button className="w-full rounded-xl h-11 gap-2" onClick={scrollToApply}>
            Apply for this role
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function MetaPill({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/90">
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
      {label}
    </span>
  );
}

function JobDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-14 border-b border-border" />
      <div className="h-48 bg-muted animate-pulse" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-[420px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
      <p className="text-sm font-medium leading-snug">{label}</p>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm py-0.5">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right truncate">{value}</span>
    </div>
  );
}

function FileUploadField({
  field, file, onChange,
}: { field: FileField; file: File | null; onChange: (f: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">
        {field.label}
        {field.required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {file ? (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/30">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{file.name}</p>
            <p className="text-[10px] text-muted-foreground">{fmtBytes(file.size)}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md" onClick={() => onChange(null)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-xl border border-dashed border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/30 transition-colors p-4 flex flex-col items-center gap-1.5"
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Click to upload</span>
          {field.hint && <span className="text-[10px] text-muted-foreground/80 text-center">{field.hint}</span>}
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
