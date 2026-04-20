import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/** GET /api/careers — public list of open jobs */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deptSlug       = searchParams.get('department');
  const locationType   = searchParams.get('location_type');
  const employmentType = searchParams.get('employment_type');
  const experienceLevel = searchParams.get('experience_level');
  const search         = searchParams.get('search')?.trim();
  const featured       = searchParams.get('featured');
  const page           = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit          = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const offset         = (page - 1) * limit;

  let query = supabaseAdmin
    .from('career_jobs')
    .select(
      `id, title, slug, location, location_type, employment_type, experience_level,
       summary, salary_min, salary_max, salary_currency, salary_period, show_salary,
       application_deadline, status, is_featured, is_urgent, application_count,
       posted_at, created_at,
       department:career_departments(id, name, slug, icon)`,
      { count: 'exact' },
    )
    .in('status', ['open'])
    .order('is_featured', { ascending: false })
    .order('posted_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (locationType)    query = query.eq('location_type', locationType);
  if (employmentType)  query = query.eq('employment_type', employmentType);
  if (experienceLevel) query = query.eq('experience_level', experienceLevel);
  if (featured === 'true') query = query.eq('is_featured', true);
  if (search)          query = query.textSearch('search_vector', search, { type: 'websearch' });

  if (deptSlug) {
    const { data: dept } = await supabaseAdmin
      .from('career_departments')
      .select('id')
      .eq('slug', deptSlug)
      .maybeSingle();
    if (dept) query = query.eq('department_id', dept.id);
  }

  const { data: jobs, error, count } = await query;

  if (error) {
    console.error('[/api/careers GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch departments for filter sidebar
  const { data: departments } = await supabaseAdmin
    .from('career_departments')
    .select('id, name, slug, icon')
    .eq('is_active', true)
    .order('sort_order');

  return NextResponse.json({ jobs: jobs ?? [], total: count ?? 0, page, limit, departments: departments ?? [] });
}
