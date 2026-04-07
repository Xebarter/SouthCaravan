import { ArrowUpRight, BarChart3, DollarSign, Globe2, ShoppingBag, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const geoPerformance = [
  { region: 'Africa', revenue: '$420k', growth: '+18%' },
  { region: 'Europe', revenue: '$295k', growth: '+11%' },
  { region: 'Middle East', revenue: '$210k', growth: '+23%' },
  { region: 'North America', revenue: '$188k', growth: '+9%' },
];

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics & Intelligence</h2>
        <p className="text-muted-foreground mt-1">
          Monitor marketplace performance, demand trends, supplier activity, and revenue health.
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Gross Revenue (30d)</p>
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-2">$1.1M</p>
            <p className="text-xs text-green-500 mt-1">+14.2% MoM</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Orders Processed</p>
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-2">8,942</p>
            <p className="text-xs text-green-500 mt-1">+10.6% MoM</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Active Buyers</p>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-2">4,321</p>
            <p className="text-xs text-green-500 mt-1">+8.1% MoM</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Supplier Utilization</p>
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-2">87%</p>
            <p className="text-xs text-green-500 mt-1">+5.4% MoM</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid xl:grid-cols-12 gap-5">
        <Card className="xl:col-span-7">
          <CardHeader>
            <CardTitle>Regional Commerce Performance</CardTitle>
            <CardDescription>Revenue distribution and growth by region.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {geoPerformance.map((row) => (
              <div key={row.region} className="rounded-md border border-border p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-primary" />
                  <span className="font-medium">{row.region}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{row.revenue}</Badge>
                  <span className="text-sm text-green-500">{row.growth}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader>
            <CardTitle>Actionable Signals</CardTitle>
            <CardDescription>Automated insights from marketplace data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-md border border-border p-3">
              High demand trend detected for <strong>Processed Foods</strong> and <strong>Solar Components</strong>.
            </div>
            <div className="rounded-md border border-border p-3">
              12 suppliers need catalog enrichment to improve conversion rate.
            </div>
            <div className="rounded-md border border-border p-3">
              Top buyer churn risk increased in Europe segment by 2.3%.
            </div>
            <button className="w-full rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-secondary transition">
              Open detailed insights
              <ArrowUpRight className="inline-block w-4 h-4 ml-2" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
