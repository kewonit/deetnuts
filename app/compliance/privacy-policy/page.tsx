import Link from "next/link";

const lastUpdated = "July 28, 2026";

export default function PrivacyPolicy() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-8 mt-20">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated: {lastUpdated}
      </p>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-3">
            Information we collect
          </h2>
          <p>
            When you continue with Google, DeetNuts receives the basic account
            information needed to sign you in, such as your Google account ID,
            email address, name, and profile image. We also store information
            you choose to save in your DeetNuts account and technical data
            needed to keep the service secure and reliable.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">
            How we use information
          </h2>
          <p>
            We use this information to authenticate you, maintain your account,
            preserve your saved preferences and activity, prevent abuse, and
            operate and improve DeetNuts. Google sign-in is used only for
            identity; DeetNuts does not request access to Gmail, Google Drive,
            Google Calendar, or other Google services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Service providers</h2>
          <p>
            Authentication and account data are processed using Google and
            Supabase. Hosting and site analytics providers may process limited
            technical information on our behalf. Their handling of information
            is governed by their own terms and privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">
            Cookies and analytics
          </h2>
          <p>
            We use essential cookies to keep you signed in and protect your
            session. We also use analytics to understand aggregate site usage.
            See our{" "}
            <Link
              href="/compliance/cookie-policy"
              className="underline hover:text-foreground"
            >
              Cookie Policy
            </Link>{" "}
            for more information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">
            Retention and your choices
          </h2>
          <p>
            We retain account information while your account is active and as
            reasonably necessary for security, legal, and operational purposes.
            You may ask to access, correct, or delete your account information
            by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Contact</h2>
          <p>
            For privacy questions or account requests, email{" "}
            <a
              href="mailto:help@deetnuts.com"
              className="underline hover:text-foreground"
            >
              help@deetnuts.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
