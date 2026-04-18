'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Send, Search, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

function toDate(v: any) {
  return v ? new Date(v) : new Date();
}

export default function BuyerMessagesPage() {
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
                          <div className="font-medium text-sm">{`Vendor ${String(conv.vendor_user_id).slice(-6)}`}</div>
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
                        {`Vendor ${String(selectedConv.vendor_user_id).slice(-6)}`}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {unreadSelected > 0 ? `${unreadSelected} unread` : 'All caught up'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
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
