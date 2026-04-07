'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search, Plus } from 'lucide-react';
import { mockConversations, mockMessages, mockUsers } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { getVendorConsoleUserId } from '@/lib/vendor-dashboard-data';

export default function VendorMessagesPage() {
  const { user } = useAuth();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const vendorUserId = getVendorConsoleUserId(user);

  const userConversations = mockConversations.filter(c => c.participants.includes(vendorUserId));
  const filteredConversations = userConversations.filter(c => {
    const otherParticipant = c.participants.find(p => p !== vendorUserId);
    const otherUser = mockUsers.find(u => u.id === otherParticipant);
    return !searchQuery || otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedConv = selectedConvId ? userConversations.find(c => c.id === selectedConvId) : null;
  const convMessages = selectedConv
    ? mockMessages.filter(m => m.conversationId === selectedConv.id).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    : [];

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    console.log('[v0] Message sent:', messageText);
    setMessageText('');
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Customer Messages</h1>
          <p className="text-muted-foreground mt-2">Communicate with your customers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
          {/* Conversations List */}
          <Card className="border-border/50 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
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
                  {filteredConversations.map(conv => {
                    const otherParticipant = conv.participants.find(p => p !== vendorUserId);
                    const otherUser = mockUsers.find(u => u.id === otherParticipant);
                    const lastMsg = mockMessages.find(m => m.conversationId === conv.id);
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
                        <div className="font-medium text-sm">{otherUser?.name}</div>
                        <p className={`text-xs line-clamp-1 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                          {lastMsg?.content || 'No messages yet'}
                        </p>
                        <p className={`text-xs mt-1 ${isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                          {conv.updatedAt.toLocaleDateString()}
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
                        {mockUsers.find(u => u.id === selectedConv.participants.find(p => p !== vendorUserId))?.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {mockUsers.find(u => u.id === selectedConv.participants.find(p => p !== vendorUserId))?.company}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">View Account</Button>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
                  {convMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === vendorUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.senderId === vendorUserId
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-foreground'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.senderId === vendorUserId ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {msg.createdAt.toLocaleTimeString()}
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
