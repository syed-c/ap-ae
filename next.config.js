/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  poweredByHeader: false,
  compress: true,

  // Rewrite sitemap URLs to API route
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap/sitemap.xml',
      },
      {
        source: '/sitemap-static.xml',
        destination: '/api/sitemap/sitemap-static.xml',
      },
      {
        source: '/sitemap-states.xml',
        destination: '/api/sitemap/sitemap-states.xml',
      },
      {
        source: '/sitemap-cities.xml',
        destination: '/api/sitemap/sitemap-cities.xml',
      },
      {
        source: '/sitemap-services.xml',
        destination: '/api/sitemap/sitemap-services.xml',
      },
      {
        source: '/sitemap-posts.xml',
        destination: '/api/sitemap/sitemap-posts.xml',
      },
      {
        source: '/sitemap-insurance.xml',
        destination: '/api/sitemap/sitemap-insurance.xml',
      },
      {
        source: '/sitemap-service-locations.xml',
        destination: '/api/sitemap/sitemap-service-locations.xml',
      },
      {
        source: '/sitemap-profiles.xml',
        destination: '/api/sitemap/sitemap-profiles.xml',
      },
    ];
  },

  // Increase static page generation timeout to handle heavy pages
  staticPageGenerationTimeout: 300,

  // Add caching headers - robots directives moved to vercel.json for cleaner control
  async headers() {
    return [
      {
        // Stale-while-revalidate for all static pages - serve stale while revalidating
        // This prevents cold starts for repeat visitors
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=3600',
          },
        ],
      },
    ];
  },

  // TypeScript and ESLint errors are now enabled for production builds
  // This ensures code quality and catches issues before deployment
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
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
