import Link from 'next/link';
import { Breadcrumbs } from '@/components/breadcrumbs';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: March 2026</p>
      </div>

      <div className="prose prose-invert max-w-none space-y-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            SouthCaravan Inc. ("Company", "we", "our", or "us") operates the SouthCaravan website (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">2. Information Collection and Use</h2>
          <p className="text-muted-foreground leading-relaxed">
            We collect several different types of information for various purposes to provide and improve our Service to you.
          </p>
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Personal Data</h3>
              <p className="text-muted-foreground">
                While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). This may include, but is not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-2">
                <li>Email address</li>
                <li>First name and last name</li>
                <li>Phone number</li>
                <li>Address, State, Province, ZIP/Postal code, City</li>
                <li>Cookies and Usage Data</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">3. Use of Data</h2>
          <p className="text-muted-foreground leading-relaxed">
            SouthCaravan uses the collected data for various purposes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>To provide and maintain our Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
            <li>To provide customer support</li>
            <li>To gather analysis or valuable information so that we can improve our Service</li>
            <li>To monitor the usage of our Service</li>
            <li>To detect, prevent and address technical issues</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">4. Security of Data</h2>
          <p className="text-muted-foreground leading-relaxed">
            The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">5. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            Depending on your location, you may have certain rights regarding your personal data. This may include the right to access, correct, delete, or port your data. To exercise any of these rights, please contact us using the information provided in the Contact section.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">6. Changes to This Privacy Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">7. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <div className="bg-secondary p-4 rounded-lg space-y-2 text-muted-foreground">
            <p>SouthCaravan Inc.</p>
            <p>Email: privacy@southcaravan.com</p>
            <p>Address: San Francisco, CA 94105, United States</p>
          </div>
        </section>
      </div>
    </div>
  );
}
