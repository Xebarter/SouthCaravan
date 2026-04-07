'use client';

import { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MessageCircle, BookOpen, Settings, Users } from 'lucide-react';

const helpCategories = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    description: 'Learn the basics and set up your account',
    articles: ['Creating Your Account', 'Updating Your Profile', 'Setting Up Two-Factor Authentication'],
  },
  {
    icon: Users,
    title: 'Buying & Orders',
    description: 'Everything about purchasing and managing orders',
    articles: ['How to Search Products', 'Placing Your First Order', 'Requesting Quotes', 'Managing Orders'],
  },
  {
    icon: Settings,
    title: 'Account & Billing',
    description: 'Manage your account and payment methods',
    articles: ['Billing History', 'Payment Methods', 'Plan Upgrade/Downgrade', 'Cancellation Policy'],
  },
  {
    icon: MessageCircle,
    title: 'Vendor Communication',
    description: 'Learn how to communicate with vendors',
    articles: ['Sending Messages', 'Video Calls', 'Resolving Disputes', 'Leaving Reviews'],
  },
];

const recentArticles = [
  { title: 'How to Use Advanced Filters', views: 1200, helpful: 89 },
  { title: 'Understanding Vendor Ratings', views: 980, helpful: 92 },
  { title: 'Bulk Order Processing', views: 750, helpful: 85 },
  { title: 'Setting Up Order Notifications', views: 650, helpful: 88 },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-12 pb-12">
      <Breadcrumbs items={[{ label: 'Help Center' }]} />

      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-bold text-foreground">Help Center</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Find answers, guides, and support for using SouthCaravan
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button>Search</Button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {helpCategories.map((category, idx) => {
          const Icon = category.icon;
          return (
            <Card key={idx} className="hover:border-primary/50 transition cursor-pointer">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.articles.map((article, aIdx) => (
                    <li key={aIdx}>
                      <a href="#" className="text-sm text-primary hover:underline">
                        {article}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Popular Articles */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Most Helpful Articles</h2>
          <p className="text-muted-foreground mt-1">Guides that have helped the most users</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {recentArticles.map((article, idx) => (
            <Card key={idx} className="hover:border-primary/50 transition cursor-pointer">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground hover:text-primary">{article.title}</h3>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{article.views.toLocaleString()} views</span>
                    <span>{article.helpful}% found helpful</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Support */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold text-foreground">Still need help?</h3>
            <p className="text-muted-foreground">Our support team is here to assist you 24/7</p>
            <div className="flex gap-4 justify-center pt-2">
              <Button>
                <MessageCircle className="w-4 h-4 mr-2" />
                Live Chat
              </Button>
              <Button variant="outline">
                Email Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
