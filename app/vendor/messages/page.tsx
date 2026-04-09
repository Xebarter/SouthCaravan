'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Search, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { mockConversations, mockMessages, mockUsers } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { getVendorConsoleUserId } from '@/lib/vendor-dashboard-data';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_PALETTE = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-teal-500',
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

export default function VendorMessagesPage() {
  const { user } = useAuth();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const vendorUserId = getVendorConsoleUserId(user);

  const userConversations = mockConversations.filter((c) =>
    c.participants.includes(vendorUserId),
  );

  const filteredConversations = userConversations.filter((c) => {
    const otherId = c.participants.find((p) => p !== vendorUserId);
    const other = mockUsers.find((u) => u.id === otherId);
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      other?.name.toLowerCase().includes(q) ||
      other?.company?.toLowerCase().includes(q)
    );
  });

  const selectedConv = selectedConvId
    ? userConversations.find((c) => c.id === selectedConvId) ?? null
    : null;

  const convMessages = selectedConv
    ? mockMessages
        .filter((m) => m.conversationId === selectedConv.id)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    : [];

  const otherUserId = selectedConv?.participants.find((p) => p !== vendorUserId);
  const otherUser = otherUserId ? mockUsers.find((u) => u.id === otherUserId) : null;

  const totalUnread = mockMessages.filter(
    (m) => m.recipientId === vendorUserId && !m.read,
  ).length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convMessages.length]);

  const handleSend = () => {
    if (!messageText.trim() || !selectedConvId) return;
    setMessageText('');
  };

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
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-3" />
                <p className="text-xs text-muted-foreground">No conversations found</p>
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {filteredConversations.map((conv) => {
                  const otherId = conv.participants.find((p) => p !== vendorUserId);
                  const other = mockUsers.find((u) => u.id === otherId);
                  const lastMsg = mockMessages
                    .filter((m) => m.conversationId === conv.id)
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
                  const isSelected = selectedConvId === conv.id;
                  const hasUnread = mockMessages.some(
                    (m) =>
                      m.conversationId === conv.id &&
                      m.recipientId === vendorUserId &&
                      !m.read,
                  );

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
                            {other?.name}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] shrink-0',
                              isSelected
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground',
                            )}
                          >
                            {conv.updatedAt.toLocaleDateString('en-US', {
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
                        {other?.company && (
                          <p
                            className={cn(
                              'text-[10px] truncate mt-0.5',
                              isSelected
                                ? 'text-primary-foreground/60'
                                : 'text-muted-foreground/70',
                            )}
                          >
                            {other.company}
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
                  {convMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
                    </div>
                  ) : (
                    convMessages.map((msg) => {
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
                              {msg.createdAt.toLocaleTimeString('en-US', {
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
