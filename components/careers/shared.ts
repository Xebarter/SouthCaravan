export interface Department {
  id: string
  name: string
  slug: string
  icon?: string
}

export interface CareerJob {
  id: string
  title: string
  slug: string
  status: string
  location: string
  location_type: string
  employment_type: string
  experience_level: string
  summary?: string | null
  salary_min?: number | null
  salary_max?: number | null
  salary_currency: string
  salary_period: string
  show_salary: boolean
  application_deadline?: string | null
  is_featured: boolean
  is_urgent: boolean
  application_count: number
  posted_at?: string | null
  department?: Department | null
}

export const EMP_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  freelance: 'Freelance',
}

export const LOC_LABELS: Record<string, string> = {
  onsite: 'On-site',
  hybrid: 'Hybrid',
  remote: 'Remote',
}

export const EXP_LABELS: Record<string, string> = {
  entry: 'Entry level',
  mid: 'Mid-level',
  senior: 'Senior',
  lead: 'Lead',
  executive: 'Executive',
}

export function fmtSalary(job: Pick<CareerJob, 'show_salary' | 'salary_min' | 'salary_max' | 'salary_currency' | 'salary_period'>) {
  if (!job.show_salary || (!job.salary_min && !job.salary_max)) return null
  const period = job.salary_period === 'yearly' ? '/yr' : job.salary_period === 'monthly' ? '/mo' : '/hr'
  const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n)
  if (job.salary_min && job.salary_max) {
    return `${job.salary_currency} ${fmt(job.salary_min)}–${fmt(job.salary_max)}${period}`
  }
  if (job.salary_min) return `From ${job.salary_currency} ${fmt(job.salary_min)}${period}`
  if (job.salary_max) return `Up to ${job.salary_currency} ${fmt(job.salary_max)}${period}`
  return null
}

export function fmtPosted(iso?: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export const WHY_JOIN = [
  {
    title: 'Mission-driven work',
    body: 'Help digitize wholesale trade and connect buyers with suppliers across Africa and beyond.',
    color: 'bg-orange-50 text-primary',
  },
  {
    title: 'Flexible ways of working',
    body: 'Remote, hybrid, and on-site roles — we hire for impact, not postcode.',
    color: 'bg-sky-50 text-sky-700',
  },
  {
    title: 'Growth & learning',
    body: 'Work alongside experienced operators in product, trade, and compliance.',
    color: 'bg-emerald-50 text-emerald-700',
  },
  {
    title: 'Inclusive team culture',
    body: 'Collaborative, respectful, and focused on building trust in B2B commerce.',
    color: 'bg-violet-50 text-violet-700',
  },
] as const
