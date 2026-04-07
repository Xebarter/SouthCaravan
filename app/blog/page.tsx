import { Breadcrumbs } from '@/components/breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, User, ArrowRight } from 'lucide-react';

const blogPosts = [
  {
    id: 1,
    title: '5 Ways to Optimize Your B2B Procurement Process',
    excerpt: 'Learn proven strategies to streamline your vendor management and reduce procurement costs.',
    date: 'March 15, 2024',
    author: 'Sarah Chen',
    category: 'Procurement',
    readTime: 5,
    featured: true,
  },
  {
    id: 2,
    title: 'Understanding Vendor Performance Metrics',
    excerpt: 'A comprehensive guide to measuring and evaluating vendor performance in real-time.',
    date: 'March 12, 2024',
    author: 'Mike Johnson',
    category: 'Analytics',
    readTime: 7,
  },
  {
    id: 3,
    title: 'Digital Transformation in Supply Chain Management',
    excerpt: 'How automation and AI are revolutionizing B2B supply chains.',
    date: 'March 8, 2024',
    author: 'Alex Rodriguez',
    category: 'Industry Trends',
    readTime: 8,
  },
  {
    id: 4,
    title: 'Getting Started: Your First 30 Days on SouthCaravan',
    excerpt: 'A step-by-step guide to maximizing your platform experience right from the start.',
    date: 'March 5, 2024',
    author: 'Lisa Wong',
    category: 'Getting Started',
    readTime: 6,
  },
  {
    id: 5,
    title: 'Case Study: How TechCorp Reduced Procurement Costs by 35%',
    excerpt: 'Real-world example of how SouthCaravan helped a Fortune 500 company improve efficiency.',
    date: 'February 28, 2024',
    author: 'David Kim',
    category: 'Case Studies',
    readTime: 10,
  },
  {
    id: 6,
    title: 'The Future of B2B E-Commerce',
    excerpt: 'Exploring emerging trends and technologies shaping the future of business procurement.',
    date: 'February 25, 2024',
    author: 'Emma Thompson',
    category: 'Future Trends',
    readTime: 9,
  },
];

export default function BlogPage() {
  const featured = blogPosts.find(post => post.featured);
  const recent = blogPosts.filter(post => !post.featured);

  return (
    <div className="space-y-12 pb-12">
      <Breadcrumbs items={[{ label: 'Blog' }]} />

      <div>
        <h1 className="text-4xl font-bold text-foreground">Blog</h1>
        <p className="text-muted-foreground mt-2">
          Industry insights, tips, and stories from the SouthCaravan team
        </p>
      </div>

      {/* Featured Post */}
      {featured && (
        <Card className="md:grid grid-cols-2 gap-6 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5">
          <div className="bg-secondary rounded-lg h-64 md:h-auto flex items-center justify-center">
            <p className="text-muted-foreground">Featured Image</p>
          </div>
          <CardContent className="flex flex-col justify-center p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary">Featured</p>
              <h2 className="text-3xl font-bold text-foreground">{featured.title}</h2>
              <p className="text-muted-foreground text-lg">{featured.excerpt}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                {featured.date}
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {featured.author}
              </div>
              <span>{featured.readTime} min read</span>
            </div>
            <Button className="w-fit" variant="default">
              Read More <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Posts */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Latest Articles</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {recent.map(post => (
            <Card key={post.id} className="hover:border-primary/50 transition flex flex-col">
              <div className="bg-secondary h-48 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Blog Image</p>
              </div>
              <CardContent className="pt-6 flex flex-col flex-grow space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-primary uppercase">{post.category}</p>
                  <h3 className="text-xl font-bold text-foreground hover:text-primary transition">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground">{post.excerpt}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    {post.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {post.author}
                  </div>
                  <span>{post.readTime} min</span>
                </div>
                <Button variant="outline" size="sm" className="w-fit">
                  Read More <ArrowRight className="w-3 h-3 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6 text-center space-y-4">
          <h3 className="text-2xl font-bold text-foreground">Subscribe to Our Newsletter</h3>
          <p className="text-muted-foreground">
            Get the latest insights and updates delivered to your inbox
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground"
            />
            <Button>Subscribe</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
