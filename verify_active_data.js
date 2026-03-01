const { createClient } = require('@supabase/supabase-js');
const dns = require('dns');
require('dotenv').config();

// Apply DNS fix
const originalLookup = dns.lookup;
dns.lookup = (...args) => {
    const [hostname, options, callback] = args;
    const cb = typeof options === 'function' ? options : callback;
    const opts = typeof options === 'function' ? {} : options;

    if (hostname === 'eneuthbghipsdvsqilmb.supabase.co') {
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

    const supabase = createClient(supabaseUrl, supabaseKey);

    const tables = ['treatments', 'states', 'cities', 'clinics'];

    for (const table of tables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            if (error) {
                console.error(`Error fetching active ${table}:`, error.message);
            } else {
                console.log(`Table '${table}': ${count} active rows found.`);
            }
        } catch (e) {
            console.error(`Fatal error checking active ${table}:`, e.message);
        }
    }

    // Check one specific state/slug to see if it matches ACTIVE_STATE_SLUGS
    const { data: states } = await supabase.from('states').select('slug').eq('is_active', true);
    console.log('Active state slugs:', states?.map(s => s.slug).join(', '));
}

verify();
