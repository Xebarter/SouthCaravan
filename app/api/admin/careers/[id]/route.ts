import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/** GET /api/admin/careers/[id] — fetch a single job with full details */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: job, error } = await supabaseAdmin
    .from('career_jobs')
    .select(`*, department:career_departments(id, name, slug, icon)`)
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!job)  return NextResponse.json({ error: 'not found' }, { status: 404 });

  return NextResponse.json({ job });
}
