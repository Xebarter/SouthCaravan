import { NextResponse } from 'next/server'
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

export async function GET() {
  const auth = await getAuthedVendorId()
  if (!auth.ok) return auth.response

  const { data: conversations, error } = await supabaseAdmin
    .from('conversations')
    .select('id,buyer_id,vendor_user_id,created_at,updated_at')
    .eq('vendor_user_id', auth.vendorId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[vendor/messages/conversations GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = conversations ?? []
  const buyerIds = [...new Set(rows.map((c: any) => c.buyer_id).filter(Boolean))]

  const buyersById = new Map<string, { id: string; email: string; name: string | null }>()
  if (buyerIds.length > 0) {
    const { data: buyers, error: buyersErr } = await supabaseAdmin
      .from('customers')
      .select('id,email,name')
      .in('id', buyerIds)
    if (buyersErr) {
      console.error('[vendor/messages/conversations GET buyers]', buyersErr)
      return NextResponse.json({ error: buyersErr.message }, { status: 500 })
    }
    for (const b of buyers ?? []) buyersById.set(b.id, { id: b.id, email: b.email, name: b.name ?? null })
  }

  // Fetch last messages (best-effort; if none, omit).
  const convIds = rows.map((c: any) => c.id)
  const lastMessageByConv = new Map<string, { id: string; content: string; createdAt: string; senderId: string }>()
  if (convIds.length > 0) {
    const { data: msgs, error: msgErr } = await supabaseAdmin
      .from('messages')
      .select('id,conversation_id,content,created_at,sender_id')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false })
    if (msgErr) {
      console.error('[vendor/messages/conversations GET last messages]', msgErr)
      return NextResponse.json({ error: msgErr.message }, { status: 500 })
    }
    for (const m of msgs ?? []) {
      if (!lastMessageByConv.has(m.conversation_id)) {
        lastMessageByConv.set(m.conversation_id, {
          id: m.id,
          content: m.content ?? '',
          createdAt: m.created_at,
          senderId: m.sender_id,
        })
      }
    }
  }

  // Unread counts for this vendor.
  const unreadByConv = new Map<string, number>()
  if (convIds.length > 0) {
    const { data: unreadMsgs, error: unreadErr } = await supabaseAdmin
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', convIds)
      .eq('recipient_id', auth.vendorId)
      .eq('read', false)
    if (unreadErr) {
      console.error('[vendor/messages/conversations GET unread]', unreadErr)
      return NextResponse.json({ error: unreadErr.message }, { status: 500 })
    }
    for (const m of unreadMsgs ?? []) {
      unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) ?? 0) + 1)
    }
  }

  const result = rows.map((c: any) => ({
    id: c.id,
    buyerId: c.buyer_id,
    buyer: buyersById.get(c.buyer_id) ?? null,
    updatedAt: c.updated_at,
    lastMessage: lastMessageByConv.get(c.id) ?? null,
    unreadCount: unreadByConv.get(c.id) ?? 0,
  }))

  return NextResponse.json({ conversations: result })
}

