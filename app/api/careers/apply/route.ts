import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const BUCKET = 'career-documents';
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

async function uploadDocument(
  applicationId: string,
  file: File,
  documentType: string,
  label: string,
): Promise<{ ok: true; storagePath: string } | { ok: false; error: string }> {
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: `${label} must be under 10 MB.` };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, error: `${label}: unsupported file type (${file.type}).` };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const storagePath = `applications/${applicationId}/${documentType}-${Date.now()}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (error) return { ok: false, error: error.message };

  await supabaseAdmin.from('career_application_documents').insert({
    application_id: applicationId,
    document_type:  documentType,
    label,
    file_name:      file.name,
    storage_path:   data.path,
    file_size:      file.size,
    mime_type:      file.type,
  });

  return { ok: true, storagePath: data.path };
}

/** POST /api/careers/apply — submit a job application */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 });
  }

  const fd = await req.formData();
  const get = (key: string) => (fd.get(key) as string | null)?.trim() || null;

  const jobId    = get('job_id');
  const fullName = get('full_name');
  const email    = get('email');
  const gdpr     = fd.get('gdpr_consent') === 'true' || fd.get('gdpr_consent') === '1';

  if (!jobId)    return NextResponse.json({ error: 'job_id is required' }, { status: 422 });
  if (!fullName) return NextResponse.json({ error: 'full_name is required' }, { status: 422 });
  if (!email)    return NextResponse.json({ error: 'email is required' }, { status: 422 });
  if (!gdpr)     return NextResponse.json({ error: 'You must consent to data processing to apply.' }, { status: 422 });

  // Validate job exists and is open
  const { data: job } = await supabaseAdmin
    .from('career_jobs')
    .select('id, status, max_applications, application_count, application_deadline')
    .eq('id', jobId)
    .maybeSingle();

  if (!job)                   return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  if (job.status !== 'open')  return NextResponse.json({ error: 'This position is no longer accepting applications.' }, { status: 409 });

  if (job.application_deadline && new Date(job.application_deadline) < new Date()) {
    return NextResponse.json({ error: 'The application deadline has passed.' }, { status: 409 });
  }
  if (job.max_applications && job.application_count >= job.max_applications) {
    return NextResponse.json({ error: 'This position has reached its maximum number of applications.' }, { status: 409 });
  }

  // Duplicate check
  const { data: dup } = await supabaseAdmin
    .from('career_applications')
    .select('id')
    .eq('job_id', jobId)
    .ilike('email', email)
    .maybeSingle();

  if (dup) {
    return NextResponse.json({ error: 'You have already applied for this position.' }, { status: 409 });
  }

  // Parse answers JSON
  let answers: Record<string, unknown> = {};
  const answersRaw = get('answers');
  if (answersRaw) {
    try { answers = JSON.parse(answersRaw); } catch { answers = {}; }
  }

  // Insert application
  const { data: application, error: appError } = await supabaseAdmin
    .from('career_applications')
    .insert({
      job_id:                 jobId,
      full_name:              fullName,
      email,
      phone:                  get('phone'),
      nationality:            get('nationality'),
      location:               get('location'),
      linkedin_url:           get('linkedin_url'),
      portfolio_url:          get('portfolio_url'),
      github_url:             get('github_url'),
      years_experience:       fd.get('years_experience') ? Number(fd.get('years_experience')) : null,
      current_company:        get('current_company'),
      current_title:          get('current_title'),
      expected_salary:        get('expected_salary'),
      start_date_availability: get('start_date_availability'),
      willing_to_relocate:    fd.get('willing_to_relocate') === 'true' || null,
      requires_sponsorship:   fd.get('requires_sponsorship') === 'true' || null,
      cover_letter:           get('cover_letter'),
      answers,
      referral_source:        get('referral_source'),
      referral_name:          get('referral_name'),
      gdpr_consent:           true,
    })
    .select('id')
    .single();

  if (appError) {
    console.error('[careers/apply POST]', appError);
    if (appError.code === '23505') {
      return NextResponse.json({ error: 'You have already applied for this position.' }, { status: 409 });
    }
    return NextResponse.json({ error: appError.message }, { status: 500 });
  }

  const applicationId = application.id;
  const uploadErrors: string[] = [];

  // Upload documents
  const docFields: Array<{ key: string; type: string; label: string; required?: boolean }> = [
    { key: 'resume',         type: 'resume',        label: 'Resume/CV',        required: true },
    { key: 'cover_letter_file', type: 'cover_letter', label: 'Cover Letter' },
    { key: 'portfolio_file', type: 'portfolio',     label: 'Portfolio' },
    { key: 'certificate',    type: 'certificate',   label: 'Certificate' },
    { key: 'other_document', type: 'other',         label: 'Additional Document' },
  ];

  for (const field of docFields) {
    const file = fd.get(field.key) as File | null;
    if (file && file.size > 0) {
      const result = await uploadDocument(applicationId, file, field.type, field.label);
      if (!result.ok) {
        uploadErrors.push(result.error);
      }
    } else if (field.required) {
      // Soft warning only — don't fail the whole application
      uploadErrors.push(`${field.label} was not provided.`);
    }
  }

  // Handle extra documents (up to 5 additional files)
  for (let i = 0; i < 5; i++) {
    const file = fd.get(`extra_document_${i}`) as File | null;
    if (file && file.size > 0) {
      const result = await uploadDocument(applicationId, file, 'other', `Additional Document ${i + 1}`);
      if (!result.ok) uploadErrors.push(result.error);
    }
  }

  return NextResponse.json({
    success: true,
    application_id: applicationId,
    warnings: uploadErrors.length ? uploadErrors : undefined,
  }, { status: 201 });
}
