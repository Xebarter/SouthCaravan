import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

function hasVendorAccess(user: any) {
  const meta = user?.app_metadata ?? {}
  if (meta.role === 'vendor') return true
  const roles = Array.isArray(meta.roles) ? meta.roles : []
  return roles.includes('vendor')
}

async function getAuthedVendorId(): Promise<
  | { ok: true; vendorId: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await getServerSupabaseClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (!hasVendorAccess(data.user)) {
    return { ok: false, response: NextResponse.json({ error: 'Vendor role required' }, { status: 403 }) }
  }
  return { ok: true, vendorId: data.user.id }
}

async function ensureConversationOwnedByVendor(conversationId: string, vendorId: string) {
  const { data: conv, error } = await supabaseAdmin
    .from('conversations')
    .select('id,buyer_id,vendor_user_id')
    .eq('id', conversationId)
    .eq('vendor_user_id', vendorId)
    .maybeSingle()

  if (error) return { ok: false as const, error: error.message, status: 500 as const }
  if (!conv) return { ok: false as const, error: 'Not found', status: 404 as const }
  return { ok: true as const, conv }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const auth = await getAuthedVendorId()
  if (!auth.ok) return auth.response

  const { conversationId } = await params
  const id = (conversationId ?? '').trim()
  if (!id) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })

  const owned = await ensureConversationOwnedByVendor(id, auth.vendorId)
  if (!owned.ok) return NextResponse.json({ error: owned.error }, { status: owned.status })

  const { data: messages, error } = await supabaseAdmin
    .from('messages')
    .select('id,conversation_id,sender_id,recipient_id,content,read,created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[vendor/messages/:id GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    conversation: { id, buyerId: owned.conv.buyer_id },
    messages: (messages ?? []).map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      recipientId: m.recipient_id,
      content: m.content ?? '',
      read: Boolean(m.read),
      createdAt: m.created_at,
    })),
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const auth = await getAuthedVendorId()
  if (!auth.ok) return auth.response

  const { conversationId } = await params
  const id = (conversationId ?? '').trim()
  if (!id) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })

  const owned = await ensureConversationOwnedByVendor(id, auth.vendorId)
  if (!owned.ok) return NextResponse.json({ error: owned.error }, { status: owned.status })

  const body = await req.json().catch(() => null)
  const content = typeof body?.content === 'string' ? body.content.trim() : ''
  if (!content) return NextResponse.json({ error: 'Message content required' }, { status: 422 })

  const buyerId = owned.conv.buyer_id as string
  const { data: msg, error } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: id,
      sender_id: auth.vendorId,
      recipient_id: buyerId,
      content,
      read: false,
    })
    .select('id,conversation_id,sender_id,recipient_id,content,read,created_at')
    .single()

  if (error) {
    console.error('[vendor/messages/:id POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Touch conversation timestamp.
  await supabaseAdmin.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', id)

  return NextResponse.json({
    message: {
      id: msg.id,
      senderId: msg.sender_id,
      recipientId: msg.recipient_id,
      content: msg.content ?? '',
      read: Boolean(msg.read),
      createdAt: msg.created_at,
    },
  }, { status: 201 })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const auth = await getAuthedVendorId()
  if (!auth.ok) return auth.response

  const { conversationId } = await params
  const id = (conversationId ?? '').trim()
  if (!id) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })

  const owned = await ensureConversationOwnedByVendor(id, auth.vendorId)
  if (!owned.ok) return NextResponse.json({ error: owned.error }, { status: owned.status })

  const body = await req.json().catch(() => null)
  const markRead = Boolean(body?.markRead)
  if (!markRead) return NextResponse.json({ error: 'Nothing to do' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', id)
    .eq('recipient_id', auth.vendorId)
    .eq('read', false)

  if (error) {
    console.error('[vendor/messages/:id PATCH read]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

