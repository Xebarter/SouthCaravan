import { Breadcrumbs } from '@/components/breadcrumbs';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Breadcrumbs items={[{ label: 'Terms of Service' }]} />

      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: March 2026</p>
      </div>

      <div className="prose prose-invert max-w-none space-y-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">1. Agreement to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing and using the SouthCaravan platform, you accept and agree to these terms. If you do not agree, do not use this service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">2. Use License</h2>
          <p className="text-muted-foreground leading-relaxed">
            You may temporarily download one copy of platform materials for personal, non-commercial viewing. This is a license grant, not a transfer of ownership.
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Do not modify or copy materials for redistribution.</li>
            <li>Do not use materials for commercial public display.</li>
            <li>Do not reverse engineer any platform software.</li>
            <li>Do not remove copyright or proprietary notices.</li>
            <li>Do not mirror materials on other servers.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">3. Disclaimer</h2>
          <p className="text-muted-foreground leading-relaxed">
            Materials on the SouthCaravan platform are provided on an "as is" basis without warranties of any kind, express or implied.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">4. Limitations</h2>
          <p className="text-muted-foreground leading-relaxed">
            SouthCaravan and its suppliers are not liable for damages arising from use or inability to use the platform materials, including data loss or business interruption.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">5. Accuracy of Materials</h2>
          <p className="text-muted-foreground leading-relaxed">
            Platform materials may include technical or typographical errors. SouthCaravan may update content at any time without notice.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">6. Links</h2>
          <p className="text-muted-foreground leading-relaxed">
            SouthCaravan is not responsible for third-party linked sites and does not endorse all external content.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">7. Modifications</h2>
          <p className="text-muted-foreground leading-relaxed">
            SouthCaravan may revise these terms at any time without notice. Continued use means you accept the latest version.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">8. Governing Law</h2>
          <p className="text-muted-foreground leading-relaxed">
            These terms are governed by the laws of the State of California, and disputes are subject to its courts.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">9. Contact Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have questions about these terms, contact us:
          </p>
          <div className="bg-secondary p-4 rounded-lg space-y-2 text-muted-foreground">
            <p>SouthCaravan Inc.</p>
            <p>Email: legal@southcaravan.com</p>
            <p>Address: San Francisco, CA 94105, United States</p>
          </div>
        </section>
      </div>
    </div>
  );
}
