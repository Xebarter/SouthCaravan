import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Pricing - SouthCaravan B2B Platform',
  description: 'Simple, transparent pricing for vendors and buyers on SouthCaravan.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-balance">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-foreground/70 text-balance">
            Scale with your business. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      {/* Pricing Tabs */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Buyer Plans */}
            <div>
              <h3 className="text-2xl font-semibold mb-8">For Buyers</h3>
              <div className="space-y-6">
                {[
                  {
                    name: 'Starter',
                    price: 'Free',
                    period: 'Forever',
                    description: 'Perfect for small businesses getting started',
                    features: [
                      'Browse vendor catalog',
                      'Create up to 10 orders/month',
                      'Basic analytics',
                      'Vendor messaging',
                      'Community support',
                    ],
                  },
                  {
                    name: 'Professional',
                    price: '$299',
                    period: '/month',
                    description: 'For growing procurement teams',
                    highlighted: true,
                    features: [
                      'Unlimited orders',
                      'Advanced analytics',
                      'Custom vendor filters',
                      'Priority support',
                      'API access',
                      'SSO authentication',
                      'Custom workflows',
                    ],
                  },
                  {
                    name: 'Enterprise',
                    price: 'Custom',
                    period: 'pricing',
                    description: 'For large organizations',
                    features: [
                      'Everything in Professional',
                      'Dedicated account manager',
                      'Custom integrations',
                      'SLA guarantee',
                      'Compliance support',
                      'On-premise option',
                    ],
                  },
                ].map((plan) => (
                  <div
                    key={plan.name}
                    className={`border rounded-lg p-8 ${
                      plan.highlighted
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border'
                    }`}
                  >
                    <h4 className="text-xl font-semibold mb-2">{plan.name}</h4>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-foreground/60"> {plan.period}</span>
                    </div>
                    <p className="text-foreground/70 text-sm mb-6">{plan.description}</p>
                    <Button className="w-full mb-6" asChild>
                      <Link href="/login">Get Started</Link>
                    </Button>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex gap-3 items-start text-sm">
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Vendor Plans */}
            <div>
              <h3 className="text-2xl font-semibold mb-8">For Vendors</h3>
              <div className="space-y-6">
                {[
                  {
                    name: 'Starter',
                    price: 'Free',
                    period: 'Forever',
                    description: 'Get discovered by enterprise buyers',
                    features: [
                      'Create product listings',
                      'Up to 50 products',
                      'Basic analytics',
                      'Customer messaging',
                      'Community support',
                    ],
                  },
                  {
                    name: 'Growth',
                    price: '$99',
                    period: '/month',
                    description: 'For vendors ready to scale',
                    highlighted: true,
                    features: [
                      'Unlimited products',
                      'Advanced analytics',
                      'Bulk operations',
                      'Priority support',
                      'API access',
                      'Custom branding',
                      'Featured listings',
                    ],
                  },
                  {
                    name: 'Enterprise',
                    price: '2-3%',
                    period: 'commission',
                    description: 'High-volume seller program',
                    features: [
                      'Dedicated account manager',
                      'Advanced integrations',
                      'White-label option',
                      'Custom negotiations',
                      'Strategic partnership',
                      'Co-marketing opportunities',
                    ],
                  },
                ].map((plan) => (
                  <div
                    key={plan.name}
                    className={`border rounded-lg p-8 ${
                      plan.highlighted
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border'
                    }`}
                  >
                    <h4 className="text-xl font-semibold mb-2">{plan.name}</h4>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-foreground/60"> {plan.period}</span>
                    </div>
                    <p className="text-foreground/70 text-sm mb-6">{plan.description}</p>
                    <Button className="w-full mb-6" asChild>
                      <Link href="/login">Apply as Vendor</Link>
                    </Button>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex gap-3 items-start text-sm">
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Commission Structure */}
          <div className="bg-card border border-border rounded-lg p-8 mb-12">
            <h3 className="text-2xl font-semibold mb-6">Commission Structure (Vendors)</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Starter Plan', rate: '5%' },
                { label: 'Growth Plan', rate: '3%' },
                { label: 'Enterprise (Volume)', rate: '2%' },
                { label: 'Premium Sellers', rate: 'Negotiable' },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{item.rate}</div>
                  <p className="text-foreground/70 text-sm">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-semibold text-center mb-8">Frequently Asked Questions</h3>
            <div className="space-y-6">
              {[
                {
                  q: 'Can I change my plan anytime?',
                  a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
                },
                {
                  q: 'Do you offer discounts for annual billing?',
                  a: 'Yes. Annual plans include a 20% discount. Contact our sales team for custom enterprise pricing.',
                },
                {
                  q: 'Is there a trial period?',
                  a: 'All plans start with a 14-day free trial. No credit card required to get started.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards, bank transfers, and purchase orders for enterprise customers.',
                },
                {
                  q: 'Are there setup fees?',
                  a: 'No setup fees for any plan. Enterprise customers may have optional onboarding services available.',
                },
              ].map((item) => (
                <div key={item.q} className="bg-card border border-border rounded-lg p-6">
                  <h4 className="font-semibold mb-2">{item.q}</h4>
                  <p className="text-foreground/70">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-card/30 px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold">Start Free Today</h2>
          <p className="text-xl text-foreground/70">
            No credit card required. Full access to platform features for 14 days.
          </p>
          <Button size="lg" asChild>
            <Link href="/login">
              Start Your Free Trial
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
