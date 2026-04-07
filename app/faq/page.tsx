'use client';

import { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'How do I create an account?',
        a: 'Click "Sign Up" on the homepage and select whether you are a Buyer or Vendor. Fill in your company information and create a secure password. You\'ll be able to start using SouthCaravan immediately after verification.',
      },
      {
        q: 'What\'s the difference between Buyer and Vendor accounts?',
        a: 'Buyer accounts allow you to browse products, place orders, and manage your procurement. Vendor accounts let you list products, manage inventory, and fulfill orders from buyers.',
      },
      {
        q: 'Is there a free trial?',
        a: 'Yes! Buyer and Vendor accounts both have a free tier. Upgrade to Pro or Enterprise plans to access premium features and higher transaction limits.',
      },
    ],
  },
  {
    category: 'Products & Orders',
    items: [
      {
        q: 'How do I search for products?',
        a: 'Use the search bar or browse by category. You can filter by price, availability, rating, and other criteria. You can also view products directly from specific vendors.',
      },
      {
        q: 'How do I place an order?',
        a: 'Add products to your cart, review the items, and proceed to checkout. You can save items as drafts to complete later. Orders are tracked in real-time from placement to delivery.',
      },
      {
        q: 'Can I request a custom quote?',
        a: 'Yes! Use the "Request Quote" feature on any product page or vendor profile. Vendors typically respond within 24 hours. You can negotiate pricing and terms directly.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We support credit cards, bank transfers, and wire transfers. Enterprise customers can arrange net payment terms. All payments are processed securely.',
      },
    ],
  },
  {
    category: 'Vendor Management',
    items: [
      {
        q: 'How do I list my products?',
        a: 'Log in to your vendor dashboard and click "Add Product". Fill in product details, upload images, set pricing, and specify availability. Your products appear instantly to buyers.',
      },
      {
        q: 'Can I bulk import products?',
        a: 'Yes! You can upload a CSV file with product information. We provide a template and validation to ensure data quality. Contact support for assistance with large imports.',
      },
      {
        q: 'How do I manage inventory?',
        a: 'Track stock levels in real-time from your dashboard. Set low stock alerts and automatic reorder points. Our system prevents overselling.',
      },
      {
        q: 'How are commissions calculated?',
        a: 'Commissions depend on your plan tier. Free vendors pay 8% per transaction, Pro vendors pay 5%, and Enterprise vendors negotiate custom rates. See our Pricing page for details.',
      },
    ],
  },
  {
    category: 'Support & Account',
    items: [
      {
        q: 'How can I contact support?',
        a: 'Use the Help Center in your dashboard, email support@southcaravan.com, or call +1 (800) 123-4567. Response times vary by plan, with Enterprise customers receiving priority support.',
      },
      {
        q: 'How do I reset my password?',
        a: 'Click "Forgot Password" on the login page. Enter your email and follow the reset link sent to your inbox. The link expires in 24 hours for security.',
      },
      {
        q: 'Is my data secure?',
        a: 'Yes. We use industry-standard encryption (HTTPS/TLS), regular security audits, and compliance with GDPR and CCPA. Your payment data never touches our servers.',
      },
      {
        q: 'Can I export my data?',
        a: 'Yes! You can download orders, invoices, and analytics reports anytime. You can also request a full data export in CSV or JSON format.',
      },
    ],
  },
  {
    category: 'Billing & Plans',
    items: [
      {
        q: 'When am I charged?',
        a: 'Subscription plans renew monthly or annually, depending on your selection. Commissions are charged per transaction automatically. You can view your billing history anytime.',
      },
      {
        q: 'Can I change or cancel my plan?',
        a: 'Yes! You can upgrade or downgrade your plan anytime from Account Settings. Downgrades take effect at the next billing cycle. Cancellations are processed immediately.',
      },
      {
        q: 'Do you offer discounts for annual billing?',
        a: 'Yes! Annual plans include a 15% discount compared to monthly billing. Contact sales@southcaravan.com for volume discounts and enterprise pricing.',
      },
      {
        q: 'What is your refund policy?',
        a: 'We offer a 30-day money-back guarantee for annual subscriptions. Monthly plans can be canceled anytime without penalty. Refunds are processed within 5-7 business days.',
      },
    ],
  },
];

export default function FAQPage() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <Breadcrumbs items={[{ label: 'FAQ' }]} />

      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Frequently Asked Questions</h1>
        <p className="text-muted-foreground">Find answers to common questions about SouthCaravan</p>
      </div>

      <div className="space-y-8">
        {faqs.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">{section.category}</h2>
            <div className="space-y-3">
              {section.items.map((item, itemIdx) => {
                const itemId = `${sectionIdx}-${itemIdx}`;
                const isExpanded = expandedItems.has(itemId);

                return (
                  <Card key={itemId} className="overflow-hidden">
                    <button
                      onClick={() => toggleItem(itemId)}
                      className="w-full px-6 py-4 flex items-start justify-between gap-4 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <span className="font-semibold text-foreground text-balance">{item.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isExpanded && (
                      <CardContent className="px-6 py-4 border-t border-border bg-secondary/30">
                        <p className="text-muted-foreground leading-relaxed">{item.a}</p>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Card className="bg-secondary/50 border-border/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Didn't find your answer?</h3>
            <p className="text-muted-foreground">
              Contact our support team at{' '}
              <a href="mailto:support@southcaravan.com" className="text-primary hover:underline">
                support@southcaravan.com
              </a>{' '}
              or call{' '}
              <a href="tel:+18001234567" className="text-primary hover:underline">
                +1 (800) 123-4567
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
