import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BarChart3, Lock, MessageSquare, Package, ShoppingCart, TrendingUp, Users } from 'lucide-react';

export const metadata = {
  title: 'Features - SouthCaravan B2B Platform',
  description: 'Explore SouthCaravan vendor management features designed for procurement teams.',
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-balance">
            Comprehensive Vendor Management Features
          </h1>
          <p className="text-xl text-foreground/70 text-balance">
            Everything you need to manage your entire supply chain in one platform
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: ShoppingCart,
                title: 'Order Management',
                description: 'Create, track, and manage orders in real-time. Get notifications at every stage of fulfillment with full visibility into order status and timelines.',
              },
              {
                icon: Package,
                title: 'Vendor Catalog',
                description: 'Browse thousands of products from verified vendors. Filter by category, price, ratings, and certifications to find exactly what you need.',
              },
              {
                icon: MessageSquare,
                title: 'Direct Messaging',
                description: 'Chat directly with vendors for custom quotes, negotiations, and support. Keep all communication in one place for easy reference.',
              },
              {
                icon: BarChart3,
                title: 'Analytics Dashboard',
                description: 'Track spending trends, vendor performance, cost savings, and market insights. Make data-driven procurement decisions.',
              },
              {
                icon: TrendingUp,
                title: 'Quote Management',
                description: 'Request custom quotes from multiple vendors. Compare pricing, terms, and delivery times side-by-side.',
              },
              {
                icon: Users,
                title: 'Vendor Management',
                description: 'Manage vendor relationships, verify credentials, and track performance metrics. Build a trusted supplier network.',
              },
              {
                icon: Lock,
                title: 'Enterprise Security',
                description: 'Bank-grade encryption, two-factor authentication, and compliance with SOC 2, ISO 27001, and GDPR standards.',
              },
              {
                icon: Package,
                title: 'Inventory Sync',
                description: 'Auto-sync inventory levels with vendors. Get alerts for low stock and set up automatic reordering.',
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="bg-card border border-border rounded-lg p-8">
                  <Icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-foreground/70 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="bg-card/30 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Built for Different Roles</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'For Buyers',
                features: [
                  'Access to 500+ verified vendors',
                  'Compare products and pricing',
                  'Streamline purchase orders',
                  'Track spending and budgets',
                  'Request custom quotes',
                  'Monitor delivery schedules',
                ],
              },
              {
                title: 'For Vendors',
                features: [
                  'Reach enterprise buyers',
                  'Manage product listings',
                  'Accept and fulfill orders',
                  'Track customer analytics',
                  'Respond to RFQs',
                  'Grow revenue potential',
                ],
              },
              {
                title: 'For Admins',
                features: [
                  'Full platform oversight',
                  'User and vendor management',
                  'Transaction monitoring',
                  'Commission tracking',
                  'Platform analytics',
                  'System configuration',
                ],
              },
            ].map((role) => (
              <div key={role.title} className="bg-background border border-border rounded-lg p-8">
                <h3 className="text-xl font-semibold mb-6">{role.title}</h3>
                <ul className="space-y-4">
                  {role.features.map((feature) => (
                    <li key={feature} className="flex gap-3 items-start">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Advanced Capabilities</h2>

          <div className="space-y-8">
            {[
              {
                title: 'API Integration',
                description: 'Connect SouthCaravan to your existing systems with our comprehensive REST API. Automate order creation, inventory sync, and reporting.',
              },
              {
                title: 'Custom Workflows',
                description: 'Configure approval workflows, payment terms, and order rules based on your unique business requirements.',
              },
              {
                title: 'Bulk Operations',
                description: 'Import products, manage prices in bulk, and execute batch operations efficiently.',
              },
              {
                title: 'Role-Based Access Control',
                description: 'Granular permissions let you control exactly what each team member can see and do on the platform.',
              },
              {
                title: 'Audit Trails',
                description: 'Complete audit logs track every action on the platform for compliance and accountability.',
              },
              {
                title: '24/7 Support',
                description: 'Dedicated support team available around the clock to help with issues and optimization.',
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-foreground/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold">See All Features in Action</h2>
          <p className="text-xl text-foreground/70">
            Start with our free trial and explore everything SouthCaravan can do for your business.
          </p>
          <Button size="lg" asChild>
            <Link href="/login">
              Get Started Free
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
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
