'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Phone, Send, Search, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

function toDate(v: any) {
  return v ? new Date(v) : new Date();
}

export default function BuyerMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const buyerId = user?.id ?? 'user-1';
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [vendorUserId, setVendorUserId] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [bootstrappedFromQuery, setBootstrappedFromQuery] = useState(false);
  const [vendorLabels, setVendorLabels] = useState<Record<string, string>>({});
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerPhoneLoaded, setBuyerPhoneLoaded] = useState(false);
  const [buyerPhoneSaving, setBuyerPhoneSaving] = useState(false);
  const [buyerPhoneError, setBuyerPhoneError] = useState<string | null>(null);

  const [vendorPhone, setVendorPhone] = useState<string | null>(null);
  const [vendorPhoneLoading, setVendorPhoneLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('buyerVendorLabels');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') setVendorLabels(parsed as Record<string, string>);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!user || buyerPhoneLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/buyer/profile', { method: 'GET', cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) return;
        const phone = typeof json?.customer?.phone === 'string' ? json.customer.phone : '';
        if (!cancelled) setBuyerPhone(phone || '');
      } finally {
        if (!cancelled) setBuyerPhoneLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, buyerPhoneLoaded]);

  const upsertVendorLabel = (vendorId: string, label: string) => {
    const id = (vendorId ?? '').trim();
    const name = (label ?? '').trim();
    if (!id || !name) return;
    setVendorLabels((prev) => {
      const next = { ...prev, [id]: name };
      try {
        localStorage.setItem('buyerVendorLabels', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const unreadSelected = useMemo(() => {
    return messages.filter((m) => String(m.recipient_id) === String(buyerId) && !m.read).length;
  }, [messages, buyerId]);

  const refreshConversations = async () => {
    if (!user) return;
    setError(null);
    setLoadingConversations(true);
    try {
      const res = await fetch('/api/buyer/conversations');
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || 'Failed to load conversations');
        return;
      }
      const rows = Array.isArray(json?.conversations) ? json.conversations : [];
      setConversations(rows);
      if (!selectedConvId && rows.length > 0) setSelectedConvId(rows[0].id);
      if (selectedConvId && rows.every((r: any) => r.id !== selectedConvId) && rows.length > 0) {
        setSelectedConvId(rows[0].id);
      }
    } finally {
      setLoadingConversations(false);
    }
  };

  const refreshMessages = async (conversationId: string) => {
    if (!user || !conversationId) return;
    setError(null);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/buyer/conversations/${encodeURIComponent(conversationId)}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || 'Failed to load messages');
        return;
      }
      const rows = Array.isArray(json?.messages) ? json.messages : [];
      setMessages(rows);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    void refreshConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedConvId]);

  useEffect(() => {
    if (!selectedConvId) return;
    void refreshMessages(selectedConvId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConvId, user]);

  useEffect(() => {
    if (!user || !selectedConvId) return;

    let cancelled = false;
    (async () => {
      try {
        // Mark messages as read (notifications handled here).
        const res = await fetch(`/api/buyer/conversations/${encodeURIComponent(selectedConvId)}/messages`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ read: true }),
        });
        if (!res.ok || cancelled) return;
        setMessages((prev) =>
          prev.map((m) =>
            String(m.recipient_id) === String(buyerId)
              ? { ...m, read: true }
              : m,
          ),
        );
      } catch {
        // non-fatal
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [buyerId, selectedConvId, user]);

  useEffect(() => {
    if (!user) return;
    const t = window.setInterval(() => {
      void refreshConversations();
      if (selectedConvId) void refreshMessages(selectedConvId);
    }, 15000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedConvId]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const other = c.vendor_user_id ?? '';
      return !searchQuery || other.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [conversations, searchQuery]);

  const selectedConv = selectedConvId ? conversations.find((c) => c.id === selectedConvId) : null;

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConvId) return;
    const content = messageText.trim();
    setMessageText('');
    const res = await fetch(`/api/buyer/conversations/${encodeURIComponent(selectedConvId)}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const json = await res.json().catch(() => null);
      const msg = json?.message;
      if (msg) setMessages((prev) => [...prev, msg]);
      void refreshConversations();
    }
  };

  const handleCreateConversation = async () => {
    setCreateError(null);
    const v = vendorUserId.trim();
    if (!v) {
      setCreateError('Vendor user ID is required.');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/buyer/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorUserId: v }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setCreateError(json?.error || 'Failed to start conversation');
        return;
      }
      const conv = json?.conversation ?? null;
      setVendorUserId('');
      setCreateOpen(false);
      await refreshConversations();
      if (conv?.id) setSelectedConvId(conv.id);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (!user || bootstrappedFromQuery) return;
    const vendorFromQuery = (searchParams.get('vendorUserId') ?? '').trim();
    if (!vendorFromQuery) return;

    const vendorLabel = (searchParams.get('vendorLabel') ?? '').trim();
    const productId = (searchParams.get('productId') ?? '').trim();
    const productName = (searchParams.get('productName') ?? '').trim();

    setBootstrappedFromQuery(true);
    (async () => {
      try {
        if (vendorLabel) upsertVendorLabel(vendorFromQuery, vendorLabel);
        const res = await fetch('/api/buyer/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendorUserId: vendorFromQuery }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) return;
        const convId = json?.conversation?.id;
        if (convId) setSelectedConvId(convId);

        if (!messageText.trim()) {
          const parts = [
            productName ? `Hi, I'm interested in “${productName}”.` : `Hi, I'm interested in this product.`,
            productId ? `Product ID: ${productId}` : '',
          ].filter(Boolean);
          setMessageText(parts.join(' '));
        }
      } finally {
        // Clean the URL so refreshes don't keep re-triggering creation.
        router.replace('/buyer/messages');
      }
    })();
    // intentionally exclude messageText so we don't re-run on typing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchParams, router, bootstrappedFromQuery]);

  useEffect(() => {
    const vendorId = String(selectedConv?.vendor_user_id ?? '').trim();
    if (!user || !vendorId) {
      setVendorPhone(null);
      return;
    }
    let cancelled = false;
    setVendorPhoneLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/buyer/vendor-contact?vendorUserId=${encodeURIComponent(vendorId)}`, {
          cache: 'no-store',
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) return;
        if (!cancelled) {
          const phone = typeof json?.phone === 'string' ? json.phone : null;
          const displayName = typeof json?.displayName === 'string' ? json.displayName.trim() : '';
          if (displayName) upsertVendorLabel(vendorId, displayName);
          setVendorPhone(phone && phone.trim() ? phone.trim() : null);
        }
      } finally {
        if (!cancelled) setVendorPhoneLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedConvId]);

  const saveBuyerPhone = async () => {
    const phone = buyerPhone.trim();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) {
      setBuyerPhoneError('Enter a valid phone number (at least 9 digits).');
      return;
    }
    setBuyerPhoneError(null);
    setBuyerPhoneSaving(true);
    try {
      const res = await fetch('/api/buyer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBuyerPhoneError(json?.error || 'Failed to save phone number');
        return;
      }
      const saved = typeof json?.customer?.phone === 'string' ? json.customer.phone : phone;
      setBuyerPhone(saved || phone);
      try {
        localStorage.setItem('currentBuyerPhone', saved || phone);
      } catch {
        // ignore
      }
    } finally {
      setBuyerPhoneSaving(false);
    }
  };

  const referenceLine = useMemo(() => {
    const productName = (searchParams.get('productName') ?? '').trim();
    const productId = (searchParams.get('productId') ?? '').trim();
    if (!productName && !productId) return '';
    if (productName && productId) return `Reference: ${productName} (Product ID: ${productId})`;
    if (productName) return `Reference: ${productName}`;
    return `Reference: Product ID ${productId}`;
  }, [searchParams]);

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="border-border/50 flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">Messages</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9"
                  onClick={() => {
                    void refreshConversations();
                    if (selectedConvId) void refreshMessages(selectedConvId);
                  }}
                  aria-label="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-secondary h-9"
                  />
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-9" aria-label="New conversation">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Start a conversation</DialogTitle>
                      <DialogDescription>Enter a vendor user ID to open a message thread.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="vendorUserId">Vendor user ID</Label>
                        <Input
                          id="vendorUserId"
                          value={vendorUserId}
                          onChange={(e) => setVendorUserId(e.target.value)}
                          placeholder="uuid (vendor auth user id)"
                        />
                      </div>
                      {createError ? (
                        <div className="text-sm text-destructive">{createError}</div>
                      ) : null}
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateConversation} disabled={creating}>
                          {creating ? 'Creating…' : 'Create'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-1 p-4">
                  {error ? (
                    <div className="text-sm text-destructive">{error}</div>
                  ) : null}
                  {loadingConversations && (
                    <div className="text-sm text-muted-foreground">Loading…</div>
                  )}
                  {filteredConversations.map(conv => {
                    const isSelected = selectedConvId === conv.id;
                    const label = vendorLabels[String(conv.vendor_user_id ?? '').trim()];

                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConvId(conv.id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-secondary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-sm">
                            {label || `Vendor ${String(conv.vendor_user_id).slice(-6)}`}
                          </div>
                          {isSelected && unreadSelected > 0 ? (
                            <Badge className="rounded-full bg-background/20 text-inherit border border-primary-foreground/20">
                              {unreadSelected > 99 ? '99+' : unreadSelected}
                            </Badge>
                          ) : null}
                        </div>
                        <p className={`text-xs line-clamp-1 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                          {isSelected && messages.length > 0 ? messages[messages.length - 1]?.content : 'Open to view messages'}
                        </p>
                        <p className={`text-xs mt-1 ${isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                          {toDate(conv.updated_at).toLocaleDateString()}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 border-border/50 flex flex-col">
            {selectedConv ? (
              <>
                {/* Header */}
                <CardHeader className="border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {vendorLabels[String(selectedConv.vendor_user_id ?? '').trim()] ||
                          `Vendor ${String(selectedConv.vendor_user_id).slice(-6)}`}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {unreadSelected > 0 ? `${unreadSelected} unread` : 'All caught up'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={vendorPhoneLoading || !vendorPhone}
                        onClick={() => {
                          if (!vendorPhone) return;
                          window.location.href = `tel:${vendorPhone}`;
                        }}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call supplier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedConvId) void refreshMessages(selectedConvId);
                        }}
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
                  {loadingMessages && (
                    <div className="text-sm text-muted-foreground">Loading messages…</div>
                  )}
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${String(msg.sender_id) === buyerId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          String(msg.sender_id) === buyerId
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-foreground'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${String(msg.sender_id) === buyerId ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {toDate(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!loadingMessages && messages.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No messages yet. Say hello.</div>
                  ) : null}
                </CardContent>

                {/* Input */}
                <CardContent className="p-4 border-t border-border/50">
                  {!buyerPhoneLoaded ? (
                    <div className="mb-3 text-xs text-muted-foreground">Loading your contact details…</div>
                  ) : !buyerPhone.trim() ? (
                    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex-1">
                          <Label htmlFor="buyer-phone" className="text-xs text-amber-900">
                            Add your phone number (so suppliers can call you)
                          </Label>
                          <Input
                            id="buyer-phone"
                            placeholder="e.g. +234 801 234 5678"
                            value={buyerPhone}
                            onChange={(e) => setBuyerPhone(e.target.value)}
                            className="mt-1 bg-background"
                          />
                          {buyerPhoneError ? (
                            <div className="text-xs text-destructive mt-1">{buyerPhoneError}</div>
                          ) : null}
                        </div>
                        <Button
                          size="sm"
                          disabled={buyerPhoneSaving}
                          onClick={saveBuyerPhone}
                          className="sm:ml-3"
                        >
                          {buyerPhoneSaving ? 'Saving…' : 'Save phone'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Your phone</p>
                        <p className="text-sm font-medium truncate">{buyerPhone}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBuyerPhone('');
                          setBuyerPhoneError(null);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  )}

                  {referenceLine ? (
                    <div className="mb-3 rounded-lg border border-border/50 bg-secondary/10 px-3 py-2">
                      <p className="text-xs text-muted-foreground">{referenceLine}</p>
                    </div>
                  ) : null}

                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="bg-secondary"
                    />
                    <Button size="sm" onClick={handleSendMessage}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-muted-foreground">No conversation selected.</p>
                  <p className="text-xs text-muted-foreground mt-2">Create a new conversation or pick one from the list.</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
