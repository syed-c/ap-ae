import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeSQL(val: unknown): string {
    if (val === null || val === undefined) return "NULL";
    if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
    if (typeof val === "number") return String(val);
    if (typeof val === "object") {
        // JSON / arrays
        const json = JSON.stringify(val);
        return `'${json.replace(/'/g, "''")}'::jsonb`;
    }
    // Check if it's an array literal like {a,b,c}
    const s = String(val);
    return `'${s.replace(/'/g, "''")}'`;
}

function buildInserts(tableName: string, rows: Record<string, unknown>[]): string {
    if (!rows || rows.length === 0) return `-- ${tableName}: no data\n`;

    const columns = Object.keys(rows[0]);
    const colList = columns.map((c) => `"${c}"`).join(", ");
    const lines: string[] = [];
    lines.push(`-- ${tableName}: ${rows.length} rows`);

    // Batch inserts in groups of 50 for performance
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

async function fetchAll(
    supabase: ReturnType<typeof createClient>,
    table: string,
    orderBy = "created_at"
): Promise<Record<string, unknown>[]> {
    const all: Record<string, unknown>[] = [];
    let from = 0;
    const chunkSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from(table)
            .select("*")
            .order(orderBy, { ascending: true })
            .range(from, from + chunkSize - 1);

        if (error) {
            console.error(`Error fetching ${table}:`, error.message);
            break;
        }
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < chunkSize) break;
        from += chunkSize;
    }

    return all;
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, serviceKey);

        // Tables in dependency order (parent tables first)
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

        let sql = `-- AppointPanda Data Export\n`;
        sql += `-- Generated: ${new Date().toISOString()}\n`;
        sql += `-- Run this AFTER all schema migrations\n\n`;
        sql += `BEGIN;\n\n`;

        for (const { name, orderBy } of tables) {
            console.log(`Exporting ${name}...`);
            const rows = await fetchAll(supabase, name, orderBy);
            sql += buildInserts(name, rows);
        }

        sql += `\nCOMMIT;\n`;

        return new Response(sql, {
            headers: {
                ...corsHeaders,
                "Content-Type": "text/plain; charset=utf-8",
                "Content-Disposition": "attachment; filename=appointpanda-data-export.sql",
            },
        });
    } catch (error) {
        console.error("Export error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});