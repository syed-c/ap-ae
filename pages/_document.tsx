import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="icon" type="image/png" href="/favicon.png?v=5" />
          <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png?v=5" />
          <link rel="manifest" href="/site.webmanifest?v=5" />
          <meta name="msapplication-TileColor" content="#0A0A0A" />
          <meta name="theme-color" content="#0A0A0A" />

          {/* Geo targeting */}
          <meta name="geo.region" content="AE" />
          <meta name="geo.placename" content="United Arab Emirates" />

          {/* Google Search Console Verification */}
          <meta name="google-site-verification" content="QXeUyCI6vHRD4bv5ZLJCYQVSvESe4uqju4tWaamlr2A" />

          {/* Critical preconnects for LCP */}
          <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://eneuthbghipsdvsqilmb.supabase.co" />

          {/* Base Organization Schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "AppointPanda",
                "url": "https://www.appointpanda.ae",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://www.appointpanda.ae/logo.png",
                  "width": 512,
                  "height": 512,
                },
                "image": "https://www.appointpanda.ae/logo.png",
                "description": "Find and book appointments with top-rated dental professionals across the UAE.",
                "address": { "@type": "PostalAddress", "addressCountry": "AE" },
                "sameAs": [
                  "https://www.facebook.com/appointpanda/",
                  "https://www.instagram.com/appointpanda/",
                  "https://www.linkedin.com/company/appointpanda/",
                  // Add Google Business Profile URL when claimed:
                  // "https://maps.google.com/?cid=XXXXXXXXXXXXXXXXX",
                ],
              }),
            }}
          />
        </Head>
        <body className="min-h-screen bg-background font-sans antialiased">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
