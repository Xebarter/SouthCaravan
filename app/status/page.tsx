import { Breadcrumbs } from '@/components/breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Clock, TrendingUp } from 'lucide-react';

const serviceStatus = [
  { name: 'API Service', status: 'Operational', uptime: '99.99%', icon: CheckCircle2, color: 'text-primary' },
  { name: 'Website', status: 'Operational', uptime: '100%', icon: CheckCircle2, color: 'text-primary' },
  { name: 'Mobile App', status: 'Operational', uptime: '99.98%', icon: CheckCircle2, color: 'text-primary' },
  { name: 'Payment Processing', status: 'Operational', uptime: '99.99%', icon: CheckCircle2, color: 'text-primary' },
  { name: 'Email Notifications', status: 'Operational', uptime: '99.95%', icon: CheckCircle2, color: 'text-primary' },
  { name: 'Analytics', status: 'Operational', uptime: '99.90%', icon: CheckCircle2, color: 'text-primary' },
];

const incidentHistory = [
  {
    date: 'March 10, 2024',
    title: 'Scheduled Maintenance',
    description: 'Database optimization completed successfully. No data loss reported.',
    duration: '45 minutes',
  },
  {
    date: 'March 1, 2024',
    title: 'Brief API Outage',
    description: 'Minor connectivity issue resolved. All services restored.',
    duration: '12 minutes',
  },
  {
    date: 'February 20, 2024',
    title: 'Scheduled Maintenance',
    description: 'Infrastructure upgrades and security patches applied.',
    duration: '2 hours',
  },
];

export default function StatusPage() {
  return (
    <div className="space-y-12 pb-12">
      <Breadcrumbs items={[{ label: 'System Status' }]} />

      <div>
        <h1 className="text-4xl font-bold text-foreground">System Status</h1>
        <p className="text-muted-foreground mt-2">
          Real-time status of SouthCaravan services and infrastructure
        </p>
      </div>

      {/* Overall Status */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <CheckCircle2 className="w-12 h-12 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Overall Status</p>
              <p className="text-3xl font-bold text-foreground">All Systems Operational</p>
              <p className="text-muted-foreground text-sm mt-1">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Status Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Service Status</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {serviceStatus.map((service, idx) => {
            const Icon = service.icon;
            return (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">{service.name}</p>
                      <p className="text-sm text-muted-foreground">Uptime: {service.uptime}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Icon className={`w-6 h-6 ${service.color}`} />
                      <span className="text-xs font-semibold text-primary">{service.status}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Incident History */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Incident History</h2>
        <div className="space-y-4">
          {incidentHistory.map((incident, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-foreground">{incident.title}</p>
                        <p className="text-sm text-muted-foreground">{incident.date}</p>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">{incident.duration}</span>
                    </div>
                    <p className="text-muted-foreground text-sm">{incident.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Uptime Graph */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            90-Day Uptime
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-1 h-8">
              {Array.from({ length: 90 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary/20 rounded hover:bg-primary/40 transition"
                  title="Day operational"
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Average uptime: 99.98% over the last 90 days
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Subscribe to Updates</p>
              <p className="text-sm text-muted-foreground">
                Get notified about maintenance windows and incidents
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
