import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/** GET /api/admin/careers/applications/[id] */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('career_applications')
    .select(`
      *,
      job:career_jobs(id, title, slug, employment_type, location, location_type, experience_level),
      documents:career_application_documents(*)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)  return NextResponse.json({ error: 'not found' }, { status: 404 });

  // Generate signed URLs for each document (24 h expiry)
  const documents = await Promise.all(
    (data.documents ?? []).map(async (doc: { storage_path: string; [key: string]: unknown }) => {
      const { data: signed } = await supabaseAdmin.storage
        .from('career-documents')
        .createSignedUrl(doc.storage_path, 60 * 60 * 24);
      return { ...doc, signed_url: signed?.signedUrl ?? null };
    }),
  );

  return NextResponse.json({ application: { ...data, documents } });
}

/** PATCH /api/admin/careers/applications/[id] — update status / notes / rating */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body: Record<string, unknown> = await req.json().catch(() => ({}));

  const patch: Record<string, unknown> = {};
  const allowed = [
    'status', 'internal_rating', 'internal_notes',
    'rejection_reason', 'reviewed_at',
  ] as const;
  for (const f of allowed) {
    if (f in body) patch[f] = body[f] ?? null;
  }
  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }
  if ('status' in patch && !patch.reviewed_at) {
    patch.reviewed_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('career_applications')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[admin/careers/applications PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ application: data });
}

/** DELETE /api/admin/careers/applications/[id] — hard delete + storage cleanup */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch documents first so we can clean up storage
  const { data: docs } = await supabaseAdmin
    .from('career_application_documents')
    .select('storage_path')
    .eq('application_id', id);

  const { error } = await supabaseAdmin
    .from('career_applications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[admin/careers/applications DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Clean up files
  if (docs && docs.length > 0) {
    const paths = docs.map((d) => d.storage_path);
    await supabaseAdmin.storage.from('career-documents').remove(paths);
  }

  return NextResponse.json({ success: true });
}
