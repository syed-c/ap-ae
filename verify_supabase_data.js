const { createClient } = require('@supabase/supabase-js');
const dns = require('dns');
require('dotenv').config();

// Apply DNS fix from run_exports.js
const originalLookup = dns.lookup;
dns.lookup = (...args) => {
    const [hostname, options, callback] = args;
    const cb = typeof options === 'function' ? options : callback;
    const opts = typeof options === 'function' ? {} : options;

    if (hostname === 'eneuthbghipsdvsqilmb.supabase.co') {
        // Using the IP confirmed by the user's script
        if (opts.all) {
            return cb(null, [{ address: '104.18.38.10', family: 4 }]);
        }
        return cb(null, '104.18.38.10', 4);
    }
    return originalLookup(...args);
};

async function verify() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    console.log('Verifying connection to:', supabaseUrl);

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing credentials in .env');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const tables = ['treatments', 'states', 'cities', 'clinics', 'dentists'];

    for (const table of tables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.error(`Error fetching ${table}:`, error.message);
            } else {
                console.log(`Table '${table}': ${count} rows found.`);
            }
        } catch (e) {
            console.error(`Fatal error checking ${table}:`, e.message);
        }
    }
}

verify();
