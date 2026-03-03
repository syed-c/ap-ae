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
          {/* Favicon */}
          <link rel="icon" type="image/png" href="/favicon.png?v=5" />
          <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png?v=5" />
          <link rel="manifest" href="/site.webmanifest?v=5" />
          <meta name="msapplication-TileColor" content="#0d9488" />
          <meta name="theme-color" content="#3a8f95" />

          {/* Geo targeting */}
          <meta name="geo.region" content="AE" />
          <meta name="geo.placename" content="United Arab Emirates" />

          {/* Google Search Console Verification */}
          <meta name="google-site-verification" content="QXeUyCI6vHRD4bv5ZLJCYQVSvESe4uqju4tWaamlr2A" />
          <meta name="google-site-verification" content="H9uwPx5Kjhrqb_8-MKqMjxN9CBQkXuBaOie7Qw61Y-0" />
          <meta name="google-site-verification" content="BSC5k9_BO_dNca0dSrKEi8KeE9p9uKCAC4vJ_eDVQxk" />
          <meta name="google-site-verification" content="rRYuAOlERaQwgPvDUKyirGO1QMVjD43uY-eXEPn--OM" />

          {/* Critical preconnects for LCP */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://eneuthbghipsdvsqilmb.supabase.co" />

          {/* Google Fonts — non-blocking load */}
          <link
            rel="preload"
            as="style"
            href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
            media="print"
            // @ts-ignore
            onLoad="this.media='all'"
          />
          <noscript>
            <link
              rel="stylesheet"
              href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
            />
          </noscript>

          {/* Base Organization Schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "AppointPanda",
                "url": "https://www.AppointPanda.ae",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://www.AppointPanda.ae/logo.png",
                  "width": 512,
                  "height": 512,
                },
                "image": "https://www.AppointPanda.ae/logo.png",
                "description": "Find and book appointments with top-rated dental professionals across the UAE.",
                "address": { "@type": "PostalAddress", "addressCountry": "AE" },
                "sameAs": [],
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
