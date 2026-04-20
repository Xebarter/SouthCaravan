'use client';

import Link from 'next/link';
import { Mail, MapPin, Phone, Linkedin, Twitter, Facebook } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Company: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
    Legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Compliance', href: '/compliance' },
    ],
  };

  return (
    <footer className="border-t border-border bg-card text-foreground">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary">SouthCaravan</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Streamline your B2B procurement with intelligent vendor management
            </p>
            <div className="flex gap-4 pt-4">
              <a href="https://linkedin.com/company/southcaravan" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/southcaravan" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition" aria-label="Twitter / X">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://facebook.com/southcaravan" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Link Sections */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-sm text-foreground mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8 pt-8 border-t border-border">
          <div className="flex gap-3 items-start">
            <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Email</p>
              <a href="mailto:support@southcaravan.com" className="text-sm text-muted-foreground hover:text-primary transition">
                support@southcaravan.com
              </a>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Phone</p>
              <a href="tel:+256783676313" className="text-sm text-muted-foreground hover:text-primary transition">
                +256 783 676 313
              </a>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Our Office</p>
              <p className="text-sm text-muted-foreground">Mutungo Zone 1, Kampala, Uganda</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-border bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} SouthCaravan Inc. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-muted-foreground hover:text-primary transition">
                Privacy
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-primary transition">
                Terms
              </Link>
              <Link href="/cookies" className="text-muted-foreground hover:text-primary transition">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
