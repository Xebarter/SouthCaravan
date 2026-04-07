import { Breadcrumbs } from '@/components/breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';

const securityFeatures = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'All data transmitted between your device and our servers is encrypted using TLS 1.3, the industry standard.'
  },
  {
    icon: Shield,
    title: 'Multi-Factor Authentication',
    description: 'Protect your account with optional 2FA using authenticator apps or SMS-based verification codes.'
  },
  {
    icon: Eye,
    title: 'Regular Security Audits',
    description: 'We conduct quarterly third-party security audits and penetration testing to identify and address vulnerabilities.'
  },
  {
    icon: Zap,
    title: 'Real-Time Threat Detection',
    description: 'Our AI-powered system monitors for suspicious activity, unauthorized access attempts, and fraud indicators 24/7.'
  },
  {
    icon: AlertCircle,
    title: 'Incident Response Plan',
    description: 'We have a documented incident response plan that is regularly tested to ensure rapid response to security events.'
  },
  {
    icon: CheckCircle2,
    title: 'Compliance Certifications',
    description: 'SouthCaravan maintains SOC 2 Type II, ISO 27001, and GDPR compliance certifications.'
  },
];

const certifications = [
  { name: 'SOC 2 Type II', year: 2024 },
  { name: 'ISO 27001', year: 2024 },
  { name: 'GDPR Compliant', year: 2024 },
  { name: 'CCPA Compliant', year: 2024 },
  { name: 'PCI DSS 3.2.1', year: 2024 },
];

export default function SecurityPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <Breadcrumbs items={[{ label: 'Security & Compliance' }]} />

      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Security & Compliance</h1>
        <p className="text-muted-foreground text-lg">
          Your data security is our top priority. Learn about the measures we take to protect your information.
        </p>
      </div>

      {/* Security Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {securityFeatures.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <Card key={idx} className="border-border/50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="p-3 bg-primary/10 rounded-lg w-fit">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Data Protection */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Data Protection</h2>
          <p className="text-muted-foreground">How we protect your sensitive information</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground">
              <p>
                Payment information is processed through PCI-compliant payment gateways. We never store full credit card numbers. All payment processing meets PCI DSS 3.2.1 standards.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground">
              <p>
                Personal data is encrypted at rest using AES-256 encryption. Access is restricted to authorized personnel with role-based access control. We maintain detailed access logs.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Backups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground">
              <p>
                We maintain automated daily backups stored in geographically redundant locations. Backups are encrypted and tested regularly to ensure recoverability.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground">
              <p>
                We retain data only as long as necessary for business purposes and legal compliance. You can request data deletion at any time, subject to legal requirements.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Certifications */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Certifications & Compliance</h2>
          <p className="text-muted-foreground">We maintain industry-leading security certifications</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {certifications.map((cert, idx) => (
            <div key={idx} className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">{cert.name}</p>
                <p className="text-sm text-muted-foreground">Certified {cert.year}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Responsible Disclosure */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Responsible Disclosure Program</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            If you discover a security vulnerability, please report it responsibly to our security team at{' '}
            <a href="mailto:security@southcaravan.com" className="text-primary hover:underline">
              security@southcaravan.com
            </a>{' '}
            instead of publicly disclosing it.
          </p>
          <p>
            We appreciate your help in keeping SouthCaravan secure. We'll acknowledge receipt within 48 hours and work with you to resolve the issue.
          </p>
        </CardContent>
      </Card>

      {/* Contact Security Team */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Questions About Security?</h3>
            <p className="text-muted-foreground">
              Contact our security team at{' '}
              <a href="mailto:security@southcaravan.com" className="text-primary hover:underline">
                security@southcaravan.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
