import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/** GET /api/careers/[id] — single open job (by id or slug) */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Try by UUID first, fall back to slug
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  let query = supabaseAdmin
    .from('career_jobs')
    .select(`*, department:career_departments(id, name, slug, icon)`)
    .in('status', ['open', 'paused']);

  if (isUuid) {
    query = query.eq('id', id);
  } else {
    query = query.eq('slug', id);
  }

  const { data: job, error } = await query.maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!job)  return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  // Increment view count (fire-and-forget)
  supabaseAdmin.rpc('career_job_increment_view', { p_job_id: job.id }).then(() => {});

  return NextResponse.json({ job });
}
