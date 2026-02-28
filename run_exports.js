const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const dns = require('dns');

// HARD-FIX FOR DNS POISONING
// The local DNS is resolving to 49.44.79.236 (Wrong)
// Public DNS (Google) says 104.18.38.10 or 172.64.149.246 (Correct)
const originalLookup = dns.lookup;
dns.lookup = (...args) => {
    const [hostname, options, callback] = args;
    const cb = typeof options === 'function' ? options : callback;
    const opts = typeof options === 'function' ? {} : options;

    if (hostname === 'eneuthbghipsdvsqilmb.supabase.co') {
        console.log(`[DNS Fix] Overriding lookup for ${hostname} to 104.18.38.10`);
        if (opts.all) {
            return cb(null, [{ address: '104.18.38.10', family: 4 }]);
        }
        return cb(null, '104.18.38.10', 4);
    }
    return originalLookup(...args);
};

async function run() {
    console.log('--- Supabase Export Script ---');

    // 1. Extract Schema
    console.log('Extracting schema from supabase/functions/export-schema/index.ts...');
    const schemaFilePath = path.join(__dirname, 'supabase/functions/export-schema/index.ts');
    if (!fs.existsSync(schemaFilePath)) {
        console.error('Schema file not found at:', schemaFilePath);
        return;
    }
    const schemaContent = fs.readFileSync(schemaFilePath, 'utf8');

    const schemaMatch = schemaContent.match(/const SCHEMA_SQL = `([\s\S]*?)`;/);
    if (!schemaMatch) {
        console.error('Could not find SCHEMA_SQL in export-schema function.');
    } else {
        let schemaSql = schemaMatch[1];
        const columnFixes = `
-- Safety fixes for existing tables
DO $body$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clinics') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clinics' AND column_name='seo_visible') THEN
            ALTER TABLE public.clinics ADD COLUMN seo_visible BOOLEAN DEFAULT true;
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='seo_pages') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='seo_pages' AND column_name='is_published') THEN
            ALTER TABLE public.seo_pages ADD COLUMN is_published BOOLEAN DEFAULT true;
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='blog_posts') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='blog_posts' AND column_name='is_published') THEN
            ALTER TABLE public.blog_posts ADD COLUMN is_published BOOLEAN DEFAULT true;
        END IF;
    END IF;
END $body$;
`;
        schemaSql = schemaSql.replace('-- INDEXES', () => columnFixes + '\n-- INDEXES');
        fs.writeFileSync('schema.sql', schemaSql);
        console.log('✅ schema.sql generated.');
    }

    // 2. Export Data
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in .env');
        return;
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const tables = [
        { name: "countries", orderBy: "name" },
        { name: "states", orderBy: "display_order" },
        { name: "cities", orderBy: "name" },
        { name: "areas", orderBy: "name" },
        { name: "treatments", orderBy: "display_order" },
        { name: "insurances", orderBy: "display_order" },
        { name: "global_settings", orderBy: "key" },
        { name: "budget_ranges", orderBy: "display_order" },
        { name: "supported_languages", orderBy: "code" },
        { name: "blog_content_templates", orderBy: "name" },
        { name: "blog_topic_clusters", orderBy: "cluster_name" },
        { name: "blog_authors", orderBy: "created_at" },
        { name: "blog_categories", orderBy: "created_at" },
        { name: "subscription_plans", orderBy: "created_at" },
        { name: "plan_features", orderBy: "created_at" },
        { name: "clinics", orderBy: "name" },
        { name: "dentists", orderBy: "name" },
        { name: "patients", orderBy: "created_at" },
        { name: "clinic_hours", orderBy: "created_at" },
        { name: "clinic_images", orderBy: "created_at" },
        { name: "clinic_insurances", orderBy: "created_at" },
        { name: "clinic_treatments", orderBy: "created_at" },
        { name: "service_price_ranges", orderBy: "created_at" },
        { name: "google_reviews", orderBy: "created_at" },
        { name: "leads", orderBy: "created_at" },
        { name: "appointments", orderBy: "created_at" },
        { name: "blog_posts", orderBy: "created_at" },
        { name: "seo_pages", orderBy: "created_at" },
        { name: "seo_content_versions", orderBy: "created_at" },
        { name: "email_templates", orderBy: "created_at" },
        { name: "appointment_types", orderBy: "created_at" },
        { name: "automation_rules", orderBy: "created_at" },
        { name: "comparison_pages", orderBy: "created_at" },
        { name: "page_content", orderBy: "created_at" },
        { name: "contact_submissions", orderBy: "created_at" },
        { name: "claim_requests", orderBy: "created_at" },
        { name: "outreach_campaigns", orderBy: "created_at" },
    ];

    function escapeSQL(val) {
        if (val === null || val === undefined) return "NULL";
        if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
        if (typeof val === "number") return String(val);
        if (typeof val === "object") {
            const json = JSON.stringify(val);
            return `'${json.replace(/'/g, "''")}'::jsonb`;
        }
        const s = String(val);
        return `'${s.replace(/'/g, "''")}'`;
    }

    function buildInserts(tableName, rows) {
        if (!rows || rows.length === 0) return `-- ${tableName}: no data\n`;
        const columns = Object.keys(rows[0]);
        const colList = columns.map((c) => `"${c}"`).join(", ");
        const lines = [];
        lines.push(`-- ${tableName}: ${rows.length} rows`);
        for (let i = 0; i < rows.length; i += 50) {
            const batch = rows.slice(i, i + 50);
            const values = batch
                .map((row) => {
                    const vals = columns.map((col) => escapeSQL(row[col]));
                    return `(${vals.join(", ")})`;
                })
                .join(",\n  ");
            lines.push(`INSERT INTO public."${tableName}" (${colList}) VALUES\n  ${values}\nON CONFLICT (id) DO NOTHING;\n`);
        }
        return lines.join("\n") + "\n";
    }

    async function fetchAll(table, orderBy = "created_at") {
        const all = [];
        let from = 0;
        const chunkSize = 1000;
        while (true) {
            const { data, error } = await supabase
                .from(table)
                .select("*")
                .order(orderBy, { ascending: true })
                .range(from, from + chunkSize - 1);
            if (error) {
                console.error(`❌ Error fetching ${table} (from=${from}):`, error.message);
                if (error.details) console.error(`  Details: ${error.details}`);
                if (error.hint) console.error(`  Hint: ${error.hint}`);
                break;
            }
            if (!data || data.length === 0) break;
            all.push(...data);
            if (data.length < chunkSize) break;
            from += chunkSize;
        }
        return all;
    }

    let sql = `-- AppointPanda Data Export\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- Run this AFTER all schema migrations\n\n`;
    sql += `BEGIN;\n\n`;

    for (const { name, orderBy } of tables) {
        console.log(`Exporting ${name}...`);
        try {
            const rows = await fetchAll(name, orderBy);
            sql += buildInserts(name, rows);
        } catch (e) {
            console.error(`Fatal error exporting ${name}:`, e.message);
        }
    }

    sql += `\nCOMMIT;\n`;

    fs.writeFileSync('data.sql', sql);
    console.log('✅ data.sql generated.');
}

run().catch(err => {
    console.error('Fatal error:', err);
});
