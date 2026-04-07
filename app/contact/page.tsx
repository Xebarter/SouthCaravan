'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', company: '', subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-balance">
            Get in Touch
          </h1>
          <p className="text-xl text-foreground/70 text-balance">
            Have questions? Our team is here to help. Reach out and we'll get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold mb-8">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  className="py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  className="py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Company</label>
                <Input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Your company name"
                  className="py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-primary"
                >
                  <option value="">Select a subject</option>
                  <option value="sales">Sales Inquiry</option>
                  <option value="support">Support Request</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us more..."
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <Button type="submit" size="lg" className="w-full">
                {submitted ? 'Message Sent!' : 'Send Message'}
              </Button>

              {submitted && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                  <p className="text-primary font-medium">Thank you! We'll be in touch soon.</p>
                </div>
              )}
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold mb-8">Contact Information</h2>

            {[
              {
                icon: Mail,
                title: 'Email',
                content: 'hello@southcaravan.io',
                subtext: 'support@southcaravan.io for immediate help',
              },
              {
                icon: Phone,
                title: 'Phone',
                content: '+1 (555) 123-4567',
                subtext: 'Mon-Fri, 9am-6pm EST',
              },
              {
                icon: MapPin,
                title: 'Address',
                content: 'San Francisco, CA',
                subtext: '123 Market Street, Suite 500',
              },
              {
                icon: Clock,
                title: 'Business Hours',
                content: 'Monday - Friday',
                subtext: '9:00 AM - 6:00 PM EST',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title}>
                  <div className="flex items-start gap-4">
                    <Icon className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                      <p className="text-foreground/80 font-medium">{item.content}</p>
                      <p className="text-foreground/60 text-sm">{item.subtext}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick Links */}
            <div className="bg-card border border-border rounded-lg p-6 mt-8">
              <h3 className="font-semibold mb-4">Quick Help</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-primary hover:text-primary/80 text-sm">
                    → View FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-primary hover:text-primary/80 text-sm">
                    → Check System Status
                  </a>
                </li>
                <li>
                  <a href="#" className="text-primary hover:text-primary/80 text-sm">
                    → Schedule a Demo
                  </a>
                </li>
                <li>
                  <a href="#" className="text-primary hover:text-primary/80 text-sm">
                    → Request Features
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-card/30 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>

          <div className="space-y-6">
            {[
              {
                q: 'What\'s the best way to reach support?',
                a: 'For urgent issues, email support@southcaravan.io and we\'ll respond within 2 hours during business hours. For non-urgent inquiries, use the contact form above.',
              },
              {
                q: 'Do you offer phone support?',
                a: 'Yes! Enterprise customers have access to phone support. Contact our sales team to learn about premium support options.',
              },
              {
                q: 'How long does it take to get a response?',
                a: 'Our team typically responds to inquiries within 2-4 hours during business hours (Mon-Fri, 9am-6pm EST).',
              },
              {
                q: 'Can I request a product demo?',
                a: 'Absolutely! Click "Schedule a Demo" in the Quick Help section or email hello@southcaravan.io to set up a personalized walkthrough.',
              },
              {
                q: 'What if I have a billing question?',
                a: 'For billing and subscription questions, please contact billing@southcaravan.io with your account details.',
              },
            ].map((item) => (
              <div key={item.q} className="bg-background border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-3">{item.q}</h3>
                <p className="text-foreground/70">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold">Ready to Get Started?</h2>
          <p className="text-xl text-foreground/70">
            Join thousands of businesses transforming their supply chain with SouthCaravan.
          </p>
          <Button size="lg" asChild>
            <a href="/login">Start Your Free Trial</a>
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
