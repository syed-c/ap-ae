const dns = require('dns');

console.log('[next.config.js] Initializing DNS Workaround...');

// DNS Workaround for Supabase (bypasses poisoned DNS on this machine)
const originalLookup = dns.lookup;
dns.lookup = (...args) => {
  const [hostname, options, callback] = args;
  const cb = typeof options === 'function' ? options : callback;
  if (hostname === 'eneuthbghipsdvsqilmb.supabase.co') {
    console.log(`[next.config.js] Intercepted DNS lookup for ${hostname} -> forcing 104.18.38.10`);
    return cb(null, '104.18.38.10', 4);
  }
  return originalLookup(...args);
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['images.unsplash.com', 'eneuthbghipsdvsqilmb.supabase.co'],
  },
  transpilePackages: ['lucide-react', 'recharts'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './src'),
    };
    return config;
  },
  experimental: {
    optimizePackageImports: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover', '@radix-ui/react-tooltip', '@radix-ui/react-tabs'],
  },
};

module.exports = nextConfig;
