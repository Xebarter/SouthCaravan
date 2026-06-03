import Link from 'next/link';
import { Facebook, Linkedin, Mail, MapPin, Phone, Twitter } from 'lucide-react';

import { SiteLogoMark } from '@/components/site-logo';
import { DEFAULT_DESCRIPTION } from '@/lib/seo/site';

const EXPLORE_LINKS = [
  { label: 'Marketplace', href: '/' },
  { label: 'FAQ', href: '/faq' },
] as const;

const COMPANY_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/contact' },
] as const;

const LEGAL_LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Cookies', href: '/cookies' },
  { label: 'Compliance', href: '/compliance' },
] as const;

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-4 lg:col-span-5">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-semibold text-foreground"
              aria-label="SouthCaravan home"
            >
              <SiteLogoMark size={28} className="h-7 w-7 shrink-0 rounded-md object-contain" />
              SouthCaravan
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {DEFAULT_DESCRIPTION}
            </p>
            <div className="flex items-center gap-4 pt-1">
              <a
                href="https://linkedin.com/company/southcaravan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com/southcaravan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://facebook.com/southcaravan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-1 lg:col-span-7">
            <LinkColumn title="Explore" links={EXPLORE_LINKS} />
            <LinkColumn title="Company" links={COMPANY_LINKS} />
            <LinkColumn title="Legal" links={LEGAL_LINKS} />
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 border-t border-border pt-8 sm:grid-cols-3">
          <div className="flex gap-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-sm font-medium text-foreground">Email</p>
              <a
                href="mailto:support@southcaravan.com"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                support@southcaravan.com
              </a>
            </div>
          </div>
          <div className="flex gap-3">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-sm font-medium text-foreground">Phone</p>
              <a
                href="tel:+256783676313"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                +256 783 676 313
              </a>
            </div>
          </div>
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-sm font-medium text-foreground">Office</p>
              <p className="text-sm text-muted-foreground">Mutungo Zone 1, Kampala, Uganda</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© {currentYear} SouthCaravan. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link href="/contact" className="transition-colors hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
