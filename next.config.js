/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  poweredByHeader: false,
  compress: true,

  // ISR Configuration - Optimize cold start latency
  // staleTimes: Static pages stay fresh for 60s, dynamic ISR pages for 5 minutes
  staleTimes: {
    static: 60,
    dynamic: 300,
  },

  // Add security and SEO headers
  async headers() {
    return [
      {
        // Block all API routes from indexing
        source: '/api/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      {
        // Block Next.js data endpoints from indexing
        source: '/_next/data/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        // Stale-while-revalidate for all static pages - serve stale while revalidating
        // This prevents cold starts for repeat visitors
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Strip console.log in production for smaller bundles & no info leakage
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // WebP + AVIF auto-conversion, expanded domain list
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'eneuthbghipsdvsqilmb.supabase.co' },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Tree-shake all heavy Radix + animation packages at build time
  transpilePackages: ['lucide-react', 'recharts'],
  experimental: {
    optimizePackageImports: [
      // Radix UI — all packages used
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
      // Animation — only import used submodules
      'framer-motion',
      // Icons — huge package, tree-shaking critical
      'lucide-react',
    ],
    // Increase ISR cache memory to 256MB to reduce cache evictions
    isrMemoryLimitBytes: 256 * 1024 * 1024,
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './src'),
    };
    return config;
  },
};

module.exports = nextConfig;
