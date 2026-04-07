import { Breadcrumbs } from '@/components/breadcrumbs';

export default function CookiesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Breadcrumbs items={[{ label: 'Cookie Policy' }]} />

      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Cookie Policy</h1>
        <p className="text-muted-foreground">Last updated: March 2026</p>
      </div>

      <div className="prose prose-invert max-w-none space-y-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">What Are Cookies?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cookies are small text files that are placed on your computer or mobile device when you visit a website. They help the website remember your preferences and information about your visit.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">How We Use Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            SouthCaravan uses cookies for the following purposes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong>Authentication:</strong> To keep you logged in and remember your preferences</li>
            <li><strong>Analytics:</strong> To understand how visitors use our platform</li>
            <li><strong>Performance:</strong> To optimize the speed and functionality of our Service</li>
            <li><strong>Marketing:</strong> To deliver targeted advertising and track campaign effectiveness</li>
            <li><strong>Security:</strong> To detect and prevent fraudulent activities</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Types of Cookies We Use</h2>
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Essential Cookies</h3>
              <p className="text-muted-foreground">
                These cookies are necessary for the website to function properly. They enable you to move around the website and use essential features.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Performance Cookies</h3>
              <p className="text-muted-foreground">
                These cookies collect anonymous data about how you use the website, including pages visited and links clicked.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Functional Cookies</h3>
              <p className="text-muted-foreground">
                These cookies remember your choices to provide a personalized experience when you visit the website.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Cookie Consent</h2>
          <p className="text-muted-foreground leading-relaxed">
            When you first visit our website, we show you a cookie banner requesting your consent. You can choose to accept all cookies, reject non-essential cookies, or customize your preferences. You can change your cookie preferences at any time through your account settings or by contacting us.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Managing Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            Most web browsers allow you to refuse cookies or alert you when cookies are being sent. You can also delete cookies that have already been set on your device. However, blocking or deleting cookies may impact your ability to use certain features of our Service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Third-Party Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            Some cookies are set by third-party services, including analytics providers and advertising partners. These are subject to their own privacy policies. We have no control over third-party cookies, but we require our partners to maintain strict privacy standards.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have questions about our use of cookies, please contact us at:
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
