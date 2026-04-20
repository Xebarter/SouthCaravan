import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/** GET /api/admin/careers/applications — list applications, optionally filtered by job */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId  = searchParams.get('job_id');
  const status = searchParams.get('status');
  const search = searchParams.get('search')?.trim();
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('career_applications')
    .select(
      `*,
       job:career_jobs(id, title, slug, employment_type, location),
       documents:career_application_documents(*)`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (jobId)  query = query.eq('job_id', jobId);
  if (status) query = query.eq('status', status);
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,current_company.ilike.%${search}%`);
  }

  const { data: applications, error, count } = await query;

  if (error) {
    console.error('[admin/careers/applications GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ applications: applications ?? [], total: count ?? 0, page, limit });
}
