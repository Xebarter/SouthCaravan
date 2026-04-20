import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import { JobForm } from '../../job-form';

export default async function EditCareerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: job, error } = await supabaseAdmin
    .from('career_jobs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !job) notFound();

  // Convert numeric / null fields to form-compatible strings
  const initialData = {
    ...job,
    salary_min:           job.salary_min != null ? String(job.salary_min) : '',
    salary_max:           job.salary_max != null ? String(job.salary_max) : '',
    max_applications:     job.max_applications != null ? String(job.max_applications) : '',
    application_deadline: job.application_deadline
      ? new Date(job.application_deadline).toISOString().slice(0, 16)
      : '',
    department_id:        job.department_id ?? '',
    summary:              job.summary ?? '',
    responsibilities:     job.responsibilities ?? '',
    requirements:         job.requirements ?? '',
    nice_to_have:         job.nice_to_have ?? '',
    benefits:             job.benefits ?? '',
    application_email:    job.application_email ?? '',
    application_url:      job.application_url ?? '',
    meta_title:           job.meta_title ?? '',
    meta_description:     job.meta_description ?? '',
  };

  return <JobForm mode="edit" initialData={initialData} />;
}
