'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search, Plus } from 'lucide-react';
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      setLoadingConversations(true);
      try {
        const res = await fetch('/api/buyer/conversations');
        const json = await res.json().catch(() => null);
        if (!res.ok || cancelled) return;
        const rows = Array.isArray(json?.conversations) ? json.conversations : [];
        setConversations(rows);
        if (!selectedConvId && rows.length > 0) setSelectedConvId(rows[0].id);
      } finally {
        if (!cancelled) setLoadingConversations(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, selectedConvId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || !selectedConvId) return;
      setLoadingMessages(true);
      try {
        const res = await fetch(`/api/buyer/conversations/${encodeURIComponent(selectedConvId)}`);
        const json = await res.json().catch(() => null);
        if (!res.ok || cancelled) return;
        const rows = Array.isArray(json?.messages) ? json.messages : [];
        setMessages(rows);
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedConvId, user]);

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
    }
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="border-border/50 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Messages</CardTitle>
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
                <Button size="sm" variant="outline" className="h-9">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-1 p-4">
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
                        <div className="font-medium text-sm">{`Vendor ${String(conv.vendor_user_id).slice(-6)}`}</div>
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
                    </div>
                    <Button variant="outline" size="sm">View Profile</Button>
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
                  <p className="text-muted-foreground">Select a conversation to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
