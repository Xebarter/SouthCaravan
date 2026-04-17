'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/auth-context';

export default function BuyerAddressesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [form, setForm] = useState({
    label: 'Shipping',
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    isDefault: true,
  });

  const refresh = async () => {
    const res = await fetch('/api/buyer/addresses');
    const json = await res.json().catch(() => null);
    if (res.ok) setAddresses(Array.isArray(json?.addresses) ? json.addresses : []);
  };

  useEffect(() => {
    if (!user) return;
    void refresh();
  }, [user]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Addresses</h1>
        <p className="text-muted-foreground mt-2">Manage shipping and billing addresses</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add address</CardTitle>
          <CardDescription>Create a new address (CRUD backed by DB)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Label (e.g. HQ)" />
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Recipient name" />
          </div>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
          <Input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} placeholder="Address line 1" />
          <Input value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} placeholder="Address line 2 (optional)" />
          <div className="grid sm:grid-cols-2 gap-3">
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
            <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State/Province" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} placeholder="ZIP/Postal" />
            <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Country" />
          </div>
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded">
            <div className="text-sm">
              <div className="font-medium">Default address</div>
              <div className="text-muted-foreground">Use this as your default shipping address</div>
            </div>
            <Switch checked={form.isDefault} onCheckedChange={(v) => setForm({ ...form, isDefault: v })} />
          </div>
          <Button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch('/api/buyer/addresses', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(form),
                });
                if (res.ok) {
                  setForm({
                    label: 'Shipping',
                    name: '',
                    phone: '',
                    line1: '',
                    line2: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: '',
                    isDefault: false,
                  });
                  await refresh();
                }
              } finally {
                setLoading(false);
              }
            }}
          >
            Save address
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved addresses</CardTitle>
          <CardDescription>{addresses.length} address(es)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {addresses.length === 0 ? (
            <div className="text-sm text-muted-foreground">No addresses yet.</div>
          ) : (
            addresses.map((a) => (
              <div key={a.id} className="p-3 rounded bg-secondary/50 flex items-start justify-between gap-4">
                <div className="text-sm min-w-0">
                  <div className="font-medium">
                    {a.label} {a.is_default ? '(Default)' : ''}
                  </div>
                  <div className="text-muted-foreground">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.zip_code}, {a.country}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await fetch(`/api/buyer/addresses/${a.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isDefault: true }),
                      });
                      await refresh();
                    }}
                  >
                    Make default
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      await fetch(`/api/buyer/addresses/${a.id}`, { method: 'DELETE' });
                      await refresh();
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

