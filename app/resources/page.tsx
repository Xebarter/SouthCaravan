import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Clock, User } from 'lucide-react';

export const metadata = {
  title: 'Resources - SouthCaravan B2B Platform',
  description: 'Learn best practices for vendor management, procurement strategies, and supply chain optimization.',
};

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="px-6 py-20 md:py-32 bg-card/30">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-balance">
            Resources & Guides
          </h1>
          <p className="text-xl text-foreground/70 text-balance">
            Learn from industry experts on procurement best practices, vendor management, and supply chain optimization.
          </p>
        </div>
      </section>

      {/* Featured Article */}
      <section className="px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Featured Article</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-colors group">
            <div className="bg-gradient-to-r from-primary/20 to-primary/10 h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">5 Ways</div>
                <p className="text-foreground/60">To Cut Procurement Costs</p>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                5 Proven Strategies to Cut Procurement Costs Without Sacrificing Quality
              </h3>
              <p className="text-foreground/70 mb-6">
                Learn from Fortune 500 procurement teams how to negotiate better, consolidate vendors, and optimize supply chains. Discover the strategies that could save your company millions.
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-foreground/60">
                  <User className="w-4 h-4" />
                  Sarah Chen, Procurement Expert
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground/60">
                  <Clock className="w-4 h-4" />
                  8 min read
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link href="#">Read Article →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: 'The Complete Guide to Vendor Evaluation',
                excerpt: 'Step-by-step framework for assessing vendor capabilities, reliability, and cultural fit.',
                author: 'Marcus Thompson',
                readTime: '12 min',
                category: 'Vendor Management',
              },
              {
                title: 'Digital Transformation in Supply Chains',
                excerpt: 'How automation and data analytics are reshaping B2B procurement in 2024.',
                author: 'Priya Patel',
                readTime: '10 min',
                category: 'Technology',
              },
              {
                title: 'Building Strategic Vendor Partnerships',
                excerpt: 'Move beyond transactional relationships to create long-term value with your suppliers.',
                author: 'Jessica Chen',
                readTime: '9 min',
                category: 'Strategy',
              },
              {
                title: 'Risk Management in Global Supply Chains',
                excerpt: 'Mitigate disruption risks and build resilience into your procurement operations.',
                author: 'David Lopez',
                readTime: '11 min',
                category: 'Risk Management',
              },
              {
                title: 'Negotiation Tactics That Work',
                excerpt: 'Proven negotiation strategies used by top procurement professionals worldwide.',
                author: 'Emma Rodriguez',
                readTime: '8 min',
                category: 'Skills',
              },
              {
                title: 'Sustainability in Procurement',
                excerpt: 'How to build an ethical, sustainable vendor network without compromising margins.',
                author: 'Michael Zhang',
                readTime: '10 min',
                category: 'Sustainability',
              },
            ].map((article) => (
              <Link
                key={article.title}
                href="#"
                className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors group"
              >
                <div className="mb-4">
                  <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {article.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-3 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                <p className="text-foreground/70 text-sm mb-6 line-clamp-2">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-foreground/60">
                  <span>{article.author}</span>
                  <span>{article.readTime} read</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Webinars & Events */}
      <section className="bg-card/30 px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Upcoming Webinars</h2>
          <div className="space-y-6">
            {[
              {
                title: 'Scaling Your Vendor Network',
                date: 'Mar 28, 2024',
                time: '2:00 PM EST',
                speaker: 'Marcus Thompson',
              },
              {
                title: 'AI and Automation in Procurement',
                date: 'Apr 4, 2024',
                time: '3:00 PM EST',
                speaker: 'Priya Patel',
              },
              {
                title: 'Legal & Compliance in B2B',
                date: 'Apr 11, 2024',
                time: '2:00 PM EST',
                speaker: 'Jessica Chen',
              },
            ].map((webinar) => (
              <div
                key={webinar.title}
                className="bg-background border border-border rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
              >
                <div>
                  <h3 className="font-bold text-lg mb-2">{webinar.title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-foreground/60">
                    <span>{webinar.date}</span>
                    <span>{webinar.time}</span>
                    <span>With {webinar.speaker}</span>
                  </div>
                </div>
                <Button variant="outline" asChild className="whitespace-nowrap">
                  <Link href="#">Register Free</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates & Tools */}
      <section className="px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Free Templates & Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Vendor Evaluation Template',
                description: 'Comprehensive spreadsheet for assessing and scoring vendor proposals.',
              },
              {
                title: 'RFQ Best Practices Guide',
                description: 'Step-by-step guide to creating effective Requests for Quotes.',
              },
              {
                title: 'Procurement ROI Calculator',
                description: 'Calculate potential savings from platform adoption and vendor consolidation.',
              },
              {
                title: 'Vendor Agreement Template',
                description: 'Customizable contract template for vendor relationships and terms.',
              },
              {
                title: 'Spend Analysis Worksheet',
                description: 'Organize and analyze your current vendor spending by category.',
              },
              {
                title: 'Negotiation Playbook',
                description: 'Tactics, frameworks, and scripts for effective vendor negotiations.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors group">
                <h3 className="font-bold mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-foreground/70 text-sm mb-4">{item.description}</p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="#">Download Free →</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold">Ready to Transform Your Procurement?</h2>
          <p className="text-xl text-foreground/70">
            Access these resources and more by joining the SouthCaravan community of smart procurement teams.
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
