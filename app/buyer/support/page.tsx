'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-context';

export default function BuyerSupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const res = await fetch('/api/buyer/support-tickets');
    const json = await res.json().catch(() => null);
    if (res.ok) setTickets(Array.isArray(json?.tickets) ? json.tickets : []);
  };

  useEffect(() => {
    if (!user) return;
    void refresh();
  }, [user]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Support</h1>
        <p className="text-muted-foreground mt-2">Create and track support tickets</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New ticket</CardTitle>
          <CardDescription>We’ll get back to you via your account email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe the issue…" />
          <Button
            disabled={loading}
            onClick={async () => {
              const s = subject.trim();
              const m = message.trim();
              if (!s || !m) return;
              setLoading(true);
              try {
                await fetch('/api/buyer/support-tickets', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ subject: s, message: m }),
                });
                setSubject('');
                setMessage('');
                await refresh();
              } finally {
                setLoading(false);
              }
            }}
          >
            Create ticket
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My tickets</CardTitle>
          <CardDescription>{tickets.length} ticket(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tickets.length === 0 ? (
            <div className="text-sm text-muted-foreground">No tickets yet.</div>
          ) : (
            tickets.map((t) => (
              <div key={t.id} className="p-3 rounded bg-secondary/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t.subject}</div>
                    <div className="text-xs text-muted-foreground">Status: {t.status}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await fetch(`/api/buyer/support-tickets/${t.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'closed' }),
                        });
                        await refresh();
                      }}
                    >
                      Close
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        await fetch(`/api/buyer/support-tickets/${t.id}`, { method: 'DELETE' });
                        await refresh();
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">{t.message}</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

