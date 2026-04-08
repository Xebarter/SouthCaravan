import { Button } from '@/components/ui/button';
import { Money } from '@/components/money';
import Link from 'next/link';
import { ArrowRight, Award, Users, Target, Zap } from 'lucide-react';

export const metadata = {
  title: 'About SouthCaravan - B2B Vendor Management',
  description: 'Learn about SouthCaravan\'s mission to revolutionize B2B procurement and vendor management.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-balance">
            Transforming B2B Procurement
          </h1>
          <p className="text-xl text-foreground/70 text-balance">
            Our mission is to connect businesses with the right vendors and create a more transparent, efficient supply chain ecosystem.
          </p>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="bg-card/30 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Our Story</h2>
          
          <div className="space-y-8">
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                SouthCaravan was founded in 2021 with a simple observation: procurement teams were still using outdated systems to manage critical business relationships. Email threads, spreadsheets, and fragmented tools made it impossible to have real visibility into vendor performance and spend.
              </p>
              <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                We built SouthCaravan to solve this problem. Today, thousands of businesses use our platform to streamline procurement, connect with verified vendors, and make data-driven supply chain decisions.
              </p>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Our vision is a world where every business, regardless of size, has access to a global marketplace of verified suppliers and the tools to build transparent, efficient relationships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Our Values</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Target,
                title: 'Focus on Transparency',
                description: 'We believe in open communication and honest pricing. No hidden fees, no surprises.',
              },
              {
                icon: Award,
                title: 'Commitment to Quality',
                description: 'Every vendor is verified. We maintain high standards to ensure reliability.',
              },
              {
                icon: Zap,
                title: 'Drive Efficiency',
                description: 'We use technology to eliminate friction and save procurement teams time.',
              },
              {
                icon: Users,
                title: 'Build Community',
                description: 'We foster collaboration between buyers and vendors to create mutual success.',
              },
            ].map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="bg-card border border-border rounded-lg p-8">
                  <Icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                  <p className="text-foreground/70">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-card/30 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Leadership Team</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Jessica Chen',
                role: 'CEO & Co-Founder',
                background: '10 years in enterprise software. Former VP at TechVendor Corp.',
              },
              {
                name: 'Marcus Thompson',
                role: 'CTO & Co-Founder',
                background: 'Ex-Google engineer. Built scalable systems serving millions of users.',
              },
              {
                name: 'Priya Patel',
                role: 'COO',
                background: (
                  <>
                    12 years in supply chain. Managed <Money amountUSD={500_000_000} notation="compact" />+ vendor
                    networks.
                  </>
                ),
              },
            ].map((member) => (
              <div key={member.name} className="bg-background border border-border rounded-lg p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/20 mx-auto mb-4 flex items-center justify-center text-primary font-bold text-2xl">
                  {member.name.charAt(0)}
                </div>
                <h3 className="text-lg font-semibold mb-1">{member.name}</h3>
                <p className="text-primary text-sm font-medium mb-4">{member.role}</p>
                <p className="text-foreground/70 text-sm">{member.background}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Our Journey</h2>

          <div className="space-y-8 max-w-2xl mx-auto">
            {[
              { year: '2021', milestone: 'Founded SouthCaravan with mission to simplify B2B procurement' },
              {
                year: '2022',
                milestone: (
                  <>
                    Reached 100 vendors, <Money amountUSD={100_000_000} notation="compact" /> GMV, Series A funding
                  </>
                ),
              },
              { year: '2023', milestone: 'Expanded to 300+ vendors, 5,000+ active buyers' },
              {
                year: '2024',
                milestone: (
                  <>
                    Hit 500+ vendors, <Money amountUSD={2_000_000_000} notation="compact" />+ GMV, Enterprise features
                  </>
                ),
              },
            ].map((item) => (
              <div key={item.year} className="flex gap-8 items-start">
                <div className="text-lg font-bold text-primary whitespace-nowrap">{item.year}</div>
                <div className="bg-card border border-border rounded-lg p-6 flex-1">
                  <p className="text-foreground/80">{item.milestone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-card/30 px-6 py-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Verified Vendors', value: '500+' },
            {
              label: 'Annual GMV',
              value: (
                <>
                  <Money amountUSD={2_000_000_000} notation="compact" />+
                </>
              ),
            },
            { label: 'Active Buyers', value: '10K+' },
            { label: 'Team Members', value: '150+' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
              <p className="text-foreground/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold">Join the SouthCaravan Movement</h2>
          <p className="text-xl text-foreground/70">
            Whether you're a buyer looking for reliable vendors or a vendor ready to scale, SouthCaravan is your platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/login">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border px-6 py-12">
        <div className="max-w-5xl mx-auto text-center text-foreground/60 text-sm">
          <p>&copy; 2024 SouthCaravan. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
