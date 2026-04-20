import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** GET /api/admin/careers — list all jobs */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status      = searchParams.get('status');
  const deptId      = searchParams.get('department_id');
  const search      = searchParams.get('search')?.trim();
  const page        = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit       = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const offset      = (page - 1) * limit;

  let query = supabaseAdmin
    .from('career_jobs')
    .select(
      `*, department:career_departments(id, name, slug, icon)`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status)  query = query.eq('status', status);
  if (deptId)  query = query.eq('department_id', deptId);
  if (search)  query = query.textSearch('search_vector', search, { type: 'websearch' });

  const { data: jobs, error, count } = await query;

  if (error) {
    console.error('[admin/careers GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs: jobs ?? [], total: count ?? 0, page, limit });
}

/** POST /api/admin/careers — create a job */
export async function POST(req: NextRequest) {
  const body: Record<string, unknown> = await req.json().catch(() => ({}));

  const title = (body.title as string | undefined)?.trim();
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 422 });

  // Unique slug
  let slug = (body.slug as string | undefined)?.trim() || slugify(title);
  const { data: existing } = await supabaseAdmin
    .from('career_jobs')
    .select('slug')
    .eq('slug', slug)
    .maybeSingle();
  if (existing) slug = `${slug}-${Date.now()}`;

  const status = (body.status as string | undefined) ?? 'draft';

  const { data: job, error } = await supabaseAdmin
    .from('career_jobs')
    .insert({
      title,
      slug,
      department_id:        (body.department_id as string | undefined)?.trim() || null,
      location:             (body.location as string | undefined)?.trim() || 'Nairobi, Kenya',
      location_type:        (body.location_type as string | undefined) ?? 'onsite',
      employment_type:      (body.employment_type as string | undefined) ?? 'full_time',
      experience_level:     (body.experience_level as string | undefined) ?? 'mid',
      summary:              (body.summary as string | undefined)?.trim() || null,
      description:          (body.description as string | undefined) ?? '',
      responsibilities:     (body.responsibilities as string | undefined) ?? null,
      requirements:         (body.requirements as string | undefined) ?? null,
      nice_to_have:         (body.nice_to_have as string | undefined) ?? null,
      benefits:             (body.benefits as string | undefined) ?? null,
      salary_min:           body.salary_min != null ? Number(body.salary_min) : null,
      salary_max:           body.salary_max != null ? Number(body.salary_max) : null,
      salary_currency:      (body.salary_currency as string | undefined) ?? 'KES',
      salary_period:        (body.salary_period as string | undefined) ?? 'yearly',
      show_salary:          body.show_salary === true || body.show_salary === 'true',
      application_deadline: (body.application_deadline as string | undefined) || null,
      application_email:    (body.application_email as string | undefined)?.trim() || null,
      application_url:      (body.application_url as string | undefined)?.trim() || null,
      max_applications:     body.max_applications != null ? Number(body.max_applications) : null,
      status,
      is_featured:          body.is_featured === true || body.is_featured === 'true',
      is_urgent:            body.is_urgent === true || body.is_urgent === 'true',
      meta_title:           (body.meta_title as string | undefined)?.trim() || null,
      meta_description:     (body.meta_description as string | undefined)?.trim() || null,
    })
    .select(`*, department:career_departments(id, name, slug, icon)`)
    .single();

  if (error) {
    console.error('[admin/careers POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ job }, { status: 201 });
}

/** PATCH /api/admin/careers — update a job (body must include id) */
export async function PATCH(req: NextRequest) {
  const body: Record<string, unknown> = await req.json().catch(() => ({}));
  const id = (body.id as string | undefined)?.trim();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const patch: Record<string, unknown> = {};

  if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim();
  if (typeof body.slug === 'string' && body.slug.trim()) {
    const { data: conflict } = await supabaseAdmin
      .from('career_jobs')
      .select('id')
      .eq('slug', body.slug.trim())
      .neq('id', id)
      .maybeSingle();
    if (conflict) return NextResponse.json({ error: 'slug already in use' }, { status: 422 });
    patch.slug = body.slug.trim();
  }
  const textFields = [
    'location', 'summary', 'description', 'responsibilities',
    'requirements', 'nice_to_have', 'benefits',
    'salary_currency', 'application_email', 'application_url',
    'meta_title', 'meta_description',
  ] as const;
  for (const f of textFields) {
    if (typeof body[f] === 'string') patch[f] = (body[f] as string).trim() || null;
  }
  const enumFields = ['location_type', 'employment_type', 'experience_level', 'salary_period', 'status'] as const;
  for (const f of enumFields) {
    if (typeof body[f] === 'string') patch[f] = body[f];
  }
  if ('department_id' in body) patch.department_id = body.department_id || null;
  if ('salary_min' in body) patch.salary_min = body.salary_min != null ? Number(body.salary_min) : null;
  if ('salary_max' in body) patch.salary_max = body.salary_max != null ? Number(body.salary_max) : null;
  if ('max_applications' in body) patch.max_applications = body.max_applications != null ? Number(body.max_applications) : null;
  if ('application_deadline' in body) patch.application_deadline = body.application_deadline || null;
  for (const b of ['show_salary', 'is_featured', 'is_urgent'] as const) {
    if (b in body) patch[b] = body[b] === true || body[b] === 'true';
  }

  const { data: job, error } = await supabaseAdmin
    .from('career_jobs')
    .update(patch)
    .eq('id', id)
    .select(`*, department:career_departments(id, name, slug, icon)`)
    .single();

  if (error) {
    console.error('[admin/careers PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ job });
}

/** DELETE /api/admin/careers?id=xxx */
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabaseAdmin.from('career_jobs').delete().eq('id', id);
  if (error) {
    console.error('[admin/careers DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
