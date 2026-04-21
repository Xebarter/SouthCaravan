'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MessageSquare, Search, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_PALETTE = [
  'bg-primary',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-600',
  'bg-teal-600',
];

function avatarColor(id: string) {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function Avatar({ id, name, size = 'md' }: { id: string; name: string; size?: 'sm' | 'md' }) {
  const cls =
    size === 'sm'
      ? 'h-7 w-7 text-[10px]'
      : 'h-9 w-9 text-xs';
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        cls,
        avatarColor(id),
      )}
    >
      {getInitials(name)}
    </div>
  );
}

type ConversationItem = {
  id: string;
  buyerId: string;
  buyer: { id: string; email: string; name: string | null } | null;
  updatedAt: string;
  lastMessage: { id: string; content: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
};

type MessageItem = {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  read: boolean;
  createdAt: string;
};

export default function VendorMessagesPage() {
  const { user } = useAuth();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const vendorUserId = user?.id ?? '';
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoadingConversations(true);
      setError('');
      try {
        const res = await fetch('/api/vendor/messages/conversations', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? 'Failed to load conversations');
        if (!cancelled) setConversations(Array.isArray(json?.conversations) ? json.conversations : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load conversations');
      } finally {
        if (!cancelled) setLoadingConversations(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !selectedConvId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingMessages(true);
      setError('');
      try {
        const res = await fetch(`/api/vendor/messages/${encodeURIComponent(selectedConvId)}`, { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? 'Failed to load messages');
        if (!cancelled) setMessages(Array.isArray(json?.messages) ? json.messages : []);
        // Mark unread as read for this conversation.
        await fetch(`/api/vendor/messages/${encodeURIComponent(selectedConvId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markRead: true }),
        }).catch(() => {});
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load messages');
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, selectedConvId]);

  const filteredConversations = conversations.filter((c) => {
    const otherName = c.buyer?.name ?? '';
    const otherEmail = c.buyer?.email ?? '';
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      otherName.toLowerCase().includes(q) ||
      otherEmail.toLowerCase().includes(q)
    );
  });

  const selectedConv = selectedConvId
    ? conversations.find((c) => c.id === selectedConvId) ?? null
    : null;

  const otherUser = selectedConv?.buyer ?? null;
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!messageText.trim() || !selectedConvId) return;
    const content = messageText.trim();
    setMessageText('');
    setError('');
    try {
      const res = await fetch(`/api/vendor/messages/${encodeURIComponent(selectedConvId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? 'Failed to send message');
      const msg = json?.message;
      if (msg?.id) setMessages((prev) => [...prev, msg]);
      // Refresh conversation list (unread counts + last message).
      fetch('/api/vendor/messages/conversations', { cache: 'no-store' })
        .then((r) => r.json())
        .then((j) => setConversations(Array.isArray(j?.conversations) ? j.conversations : []))
        .catch(() => {});
    } catch (e: any) {
      setError(e?.message || 'Failed to send message');
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 lg:px-8 py-8" style={{ height: 'calc(100dvh - 4rem)' }}>
      {/* Page header */}
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {totalUnread > 0
            ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}`
            : 'All caught up'}
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Split pane */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 flex-1 min-h-0">
        {/* Conversation list */}
        <div className="flex flex-col rounded-xl border border-border/60 overflow-hidden min-h-0">
          {/* Search bar */}
          <div className="px-3 py-3 border-b border-border/60 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search people or companies…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </div>

          {/* List */}
          <ScrollArea className="flex-1 min-h-0">
            {loadingConversations ? (
              <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-xs">Loading conversations…</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-3" />
                <p className="text-xs text-muted-foreground">No conversations found</p>
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {filteredConversations.map((conv) => {
                  const other = conv.buyer;
                  const lastMsg = conv.lastMessage;
                  const isSelected = selectedConvId === conv.id;
                  const hasUnread = (conv.unreadCount ?? 0) > 0;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-secondary/60',
                      )}
                    >
                      {other && (
                        <Avatar id={other.id} name={other.name} />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={cn(
                              'text-sm font-semibold truncate',
                              isSelected ? 'text-primary-foreground' : '',
                            )}
                          >
                            {other?.name ?? other?.email ?? 'Buyer'}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] shrink-0',
                              isSelected
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground',
                            )}
                          >
                            {new Date(conv.updatedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <p
                            className={cn(
                              'text-xs truncate',
                              isSelected
                                ? 'text-primary-foreground/75'
                                : 'text-muted-foreground',
                            )}
                          >
                            {lastMsg?.content ?? 'No messages yet'}
                          </p>
                          {hasUnread && !isSelected && (
                            <span className="shrink-0 h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        {other?.email && (
                          <p
                            className={cn(
                              'text-[10px] truncate mt-0.5',
                              isSelected
                                ? 'text-primary-foreground/60'
                                : 'text-muted-foreground/70',
                            )}
                          >
                            {other.email}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat area */}
        <div className="flex flex-col rounded-xl border border-border/60 overflow-hidden min-h-0">
          {selectedConv && otherUser ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border/60 bg-secondary/20 shrink-0">
                <Avatar id={otherUser.id} name={otherUser.name} />
                <div>
                  <p className="text-sm font-semibold leading-tight">{otherUser.name}</p>
                  {otherUser.company && (
                    <p className="text-xs text-muted-foreground mt-0.5">{otherUser.company}</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 min-h-0">
                <div className="px-5 py-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p className="text-xs">Loading messages…</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === vendorUserId;
                      return (
                        <div
                          key={msg.id}
                          className={cn('flex items-end gap-2', isMine ? 'justify-end' : 'justify-start')}
                        >
                          {!isMine && (
                            <Avatar id={otherUser.id} name={otherUser.name} size="sm" />
                          )}
                          <div
                            className={cn(
                              'max-w-xs lg:max-w-sm xl:max-w-md rounded-2xl px-4 py-2.5 shadow-sm',
                              isMine
                                ? 'rounded-br-sm bg-primary text-primary-foreground'
                                : 'rounded-bl-sm bg-secondary text-foreground',
                            )}
                          >
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <p
                              className={cn(
                                'text-[10px] mt-1',
                                isMine
                                  ? 'text-primary-foreground/60 text-right'
                                  : 'text-muted-foreground',
                              )}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message composer */}
              <div className="px-4 py-3 border-t border-border/60 bg-secondary/10 shrink-0">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Write a message…"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="flex-1 bg-background"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!messageText.trim()}
                    className="shrink-0 h-9 w-9"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="rounded-full bg-secondary p-5 mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-base font-semibold">Select a conversation</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Choose a conversation from the list on the left to start reading and replying.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
