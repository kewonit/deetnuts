const lastUpdated = "July 28, 2026";

export default function CookiePolicy() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-8 mt-20">
      <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated: {lastUpdated}
      </p>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-3">What cookies are</h2>
          <p>
            Cookies are small pieces of data stored by your browser. They help
            websites remember sessions and understand how the site is used.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Essential cookies</h2>
          <p>
            DeetNuts and Supabase use essential cookies to complete Google
            sign-in, maintain your authenticated session, and protect account
            security. The signed-in experience will not work correctly if these
            cookies are blocked.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Analytics</h2>
          <p>
            DeetNuts uses Google Analytics to measure aggregate traffic and
            usage. Your browser or privacy tools may let you limit analytics
            cookies or tracking.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">
            Managing your browser
          </h2>
          <p>
            You can remove or block cookies through your browser settings.
            Removing essential session cookies will sign you out of DeetNuts.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Contact</h2>
          <p>
            Questions about this policy can be sent to{" "}
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
