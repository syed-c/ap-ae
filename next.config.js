const dns = require('dns');

console.log('[next.config.js] Initializing DNS Workaround...');

// DNS Workaround for Supabase (bypasses poisoned DNS on developer machines)
const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  if (hostname === 'eneuthbghipsdvsqilmb.supabase.co') {
    // Force a stable Cloudflare IP for Supabase
    return callback(null, '172.67.68.214', 4);
  }

  return originalLookup.call(dns, hostname, options, callback);
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
