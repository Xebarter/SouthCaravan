'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Archive, CheckCheck, Loader2, Mail, MailOpen, MoreVertical,
  Phone, Search, Trash2, Building2, Star, TriangleAlert, User,
  Calendar, Tag, ChevronDown,
} from 'lucide-react';

interface Message {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  subject: string;
  message: string;
  status: string;
  priority: string;
  admin_notes?: string | null;
  replied_at?: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  new:      'bg-blue-500/10 text-blue-600 border-blue-200',
  read:     'bg-gray-500/10 text-gray-500 border-gray-200',
  replied:  'bg-green-500/10 text-green-600 border-green-200',
  archived: 'bg-slate-500/10 text-slate-400 border-slate-200',
  spam:     'bg-red-500/10 text-red-500 border-red-200',
};

const PRIORITY_COLORS: Record<string, string> = {
  low:    'bg-gray-100 text-gray-500',
  normal: '',
  high:   'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

const SUBJECT_LABELS: Record<string, string> = {
  general:        'General Enquiry',
  sales:          'Sales & Pricing',
  support:        'Support Request',
  partnership:    'Partnership',
  billing:        'Billing',
  vendor_inquiry: 'Vendor Enquiry',
  careers:        'Careers',
  other:          'Other',
};

const STATUS_OPTIONS = [
  { value: 'new',      label: 'New' },
  { value: 'read',     label: 'Read' },
  { value: 'replied',  label: 'Replied' },
  { value: 'archived', label: 'Archived' },
  { value: 'spam',     label: 'Spam' },
];

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high',   label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function fmtDate(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminMessagesPage() {
  const [messages, setMessages]     = useState<Message[]>([]);
  const [total, setTotal]           = useState(0);
  const [unread, setUnread]         = useState(0);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [subjectFilter, setSubject] = useState('all');
  const [page, setPage]             = useState(1);

  // Detail dialog
  const [selected, setSelected]     = useState<Message | null>(null);
  const [detailLoading, setDL]      = useState(false);
  const [editNotes, setEditNotes]   = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [saving, setSaving]         = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId]     = useState<string | null>(null);

  // Bulk selection
  const [selected_ids, setSelIds]   = useState<Set<string>>(new Set());

  const limit = 25;

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter !== 'all') p.set('status', statusFilter);
    if (subjectFilter !== 'all') p.set('subject', subjectFilter);
    if (search) p.set('search', search);
    try {
      const res = await fetch(`/api/admin/messages?${p}`);
      const data = await res.json();
      setMessages(data.messages ?? []);
      setTotal(data.total ?? 0);
      setUnread(data.unread ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, subjectFilter, search]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  async function openMessage(msg: Message) {
    setDL(true);
    setSelected(null);
    const res = await fetch(`/api/admin/messages/${msg.id}`);
    const data = await res.json();
    setDL(false);
    if (data.message) {
      setSelected(data.message);
      setEditNotes(data.message.admin_notes ?? '');
      setEditStatus(data.message.status);
      setEditPriority(data.message.priority);
      // Refresh list to update unread count
      fetchMessages();
    }
  }

  async function saveMessage() {
    if (!selected) return;
    setSaving(true);
    await fetch(`/api/admin/messages/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: editStatus,
        priority: editPriority,
        admin_notes: editNotes,
      }),
    });
    setSaving(false);
    setSelected(null);
    fetchMessages();
  }

  async function quickStatus(id: string, status: string) {
    await fetch(`/api/admin/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchMessages();
  }

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/admin/messages/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    if (selected?.id === deleteId) setSelected(null);
    fetchMessages();
  }

  async function bulkAction(action: 'read' | 'archived' | 'spam' | 'delete') {
    if (!selected_ids.size) return;
    const ids = [...selected_ids];
    if (action === 'delete') {
      await fetch(`/api/admin/messages?ids=${ids.join(',')}`, { method: 'DELETE' });
    } else {
      await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status: action }),
      });
    }
    setSelIds(new Set());
    fetchMessages();
  }

  const totalPages = Math.ceil(total / limit);
  const allSelected = messages.length > 0 && messages.every((m) => selected_ids.has(m.id));

  function toggleAll() {
    if (allSelected) setSelIds(new Set());
    else setSelIds(new Set(messages.map((m) => m.id)));
  }

  function toggleOne(id: string) {
    setSelIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const stats = {
    new:      messages.filter((m) => m.status === 'new').length,
    replied:  messages.filter((m) => m.status === 'replied').length,
    support:  messages.filter((m) => m.subject === 'support').length,
    urgent:   messages.filter((m) => m.priority === 'urgent' || m.priority === 'high').length,
  };

  return (
    <main>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              Messages
              {unread > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">Contact form submissions from your website</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Unread',     value: unread,       icon: Mail,         color: 'text-blue-600' },
            { label: 'Replied',    value: stats.replied, icon: CheckCheck,  color: 'text-green-600' },
            { label: 'Support',    value: stats.support, icon: MailOpen,    color: 'text-purple-600' },
            { label: 'High / Urgent', value: stats.urgent, icon: TriangleAlert, color: 'text-orange-600' },
          ].map((s) => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                  <s.icon className={`w-5 h-5 ${s.color} opacity-70`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, message…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={subjectFilter} onValueChange={(v) => { setSubject(v); setPage(1); }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {Object.entries(SUBJECT_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Message list */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Inbox</CardTitle>
                <CardDescription>{total} total message{total !== 1 ? 's' : ''}</CardDescription>
              </div>
              {selected_ids.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{selected_ids.size} selected</span>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => bulkAction('read')}>Mark Read</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => bulkAction('archived')}>Archive</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => bulkAction('delete')}>Delete</Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading messages…
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <MailOpen className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No messages found.</p>
              </div>
            ) : (
              <>
                {/* Select all row */}
                <div className="flex items-center gap-3 px-5 py-2 border-b border-border bg-secondary/20">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded"
                    aria-label="Select all"
                  />
                  <span className="text-xs text-muted-foreground">Select all on this page</span>
                </div>

                <div className="divide-y divide-border">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-4 px-5 py-3.5 hover:bg-secondary/30 transition-colors cursor-pointer ${msg.status === 'new' ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''}`}
                      onClick={() => openMessage(msg)}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selected_ids.has(msg.id)}
                        onChange={(e) => { e.stopPropagation(); toggleOne(msg.id); }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 rounded"
                      />

                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${msg.status === 'new' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                        {msg.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[msg.status] ?? ''}`}>
                            {msg.status}
                          </span>
                          {(msg.priority === 'high' || msg.priority === 'urgent') && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${PRIORITY_COLORS[msg.priority]}`}>
                              <TriangleAlert className="w-2.5 h-2.5 mr-0.5" />
                              {msg.priority}
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary border border-border text-muted-foreground">
                            {SUBJECT_LABELS[msg.subject] ?? msg.subject}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${msg.status === 'new' ? 'font-semibold' : 'font-medium'}`}>
                          {msg.name}
                          {msg.company && <span className="text-muted-foreground font-normal"> · {msg.company}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.message}</p>
                      </div>

                      {/* Right meta */}
                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">{fmtDate(msg.created_at)}</span>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => quickStatus(msg.id, 'read')}>
                                <MailOpen className="w-3.5 h-3.5 mr-2" /> Mark Read
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => quickStatus(msg.id, 'replied')}>
                                <CheckCheck className="w-3.5 h-3.5 mr-2" /> Mark Replied
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => quickStatus(msg.id, 'archived')}>
                                <Archive className="w-3.5 h-3.5 mr-2" /> Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => quickStatus(msg.id, 'spam')}>
                                <TriangleAlert className="w-3.5 h-3.5 mr-2" /> Mark as Spam
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteId(msg.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Message Detail Dialog ── */}
      <Dialog open={!!selected || detailLoading} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {detailLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : selected ? (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <DialogTitle className="text-base">{selected.name}</DialogTitle>
                    <DialogDescription className="text-xs mt-0.5">
                      {SUBJECT_LABELS[selected.subject] ?? selected.subject} · {fmtDate(selected.created_at)}
                    </DialogDescription>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${STATUS_COLORS[selected.status] ?? ''}`}>
                    {selected.status}
                  </span>
                </div>
              </DialogHeader>

              <div className="space-y-5 mt-1">
                {/* Sender info grid */}
                <div className="rounded-md bg-secondary/50 border border-border p-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <InfoRow icon={<User className="w-3.5 h-3.5" />}    label="Name"    value={selected.name} />
                  <InfoRow icon={<Mail className="w-3.5 h-3.5" />}    label="Email"   value={selected.email} href={`mailto:${selected.email}`} />
                  {selected.phone   && <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={selected.phone} href={`tel:${selected.phone}`} />}
                  {selected.company && <InfoRow icon={<Building2 className="w-3.5 h-3.5" />} label="Company" value={selected.company} />}
                  <InfoRow icon={<Tag className="w-3.5 h-3.5" />}   label="Subject"   value={SUBJECT_LABELS[selected.subject] ?? selected.subject} />
                  <InfoRow icon={<Star className="w-3.5 h-3.5" />} label="Priority"   value={selected.priority} />
                  <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Received" value={new Date(selected.created_at).toLocaleString('en-GB')} />
                  {selected.replied_at && <InfoRow icon={<CheckCheck className="w-3.5 h-3.5" />} label="Replied" value={new Date(selected.replied_at).toLocaleString('en-GB')} />}
                </div>

                {/* Message body */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Message</p>
                  <div className="rounded-md border border-border bg-secondary/20 p-4 text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {selected.message}
                  </div>
                </div>

                {/* Reply shortcut */}
                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(SUBJECT_LABELS[selected.subject] ?? selected.subject)} – SouthCaravan`}
                  className="w-full"
                >
                  <Button className="w-full" variant="outline" onClick={() => {
                    // Mark as replied after opening email client
                    fetch(`/api/admin/messages/${selected.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'replied' }),
                    }).then(() => fetchMessages());
                  }}>
                    <Mail className="w-4 h-4 mr-2" />
                    Reply via Email
                  </Button>
                </a>

                {/* Admin controls */}
                <div className="border-t border-border pt-4 space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Update</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Status</Label>
                      <Select value={editStatus} onValueChange={setEditStatus}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Priority</Label>
                      <Select value={editPriority} onValueChange={setEditPriority}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Internal Notes</Label>
                    <Textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Notes visible to the admin team only…"
                      rows={3}
                      className="text-sm"
                    />
                  </div>

                  <div className="flex gap-2 justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => { setDeleteId(selected.id); setSelected(null); }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Cancel</Button>
                      <Button size="sm" onClick={saveMessage} disabled={saving}>
                        {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ── */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this message. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function InfoRow({
  icon, label, value, href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-0.5">
        {icon}{label}
      </p>
      {href ? (
        <a href={href} className="text-sm font-medium text-primary hover:underline truncate block">
          {value}
        </a>
      ) : (
        <p className="text-sm font-medium truncate">{value}</p>
      )}
    </div>
  );
}
