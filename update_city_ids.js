import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = 'http://localhost:3000/api/sb-proxy/';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Fetching active cities...');
    const { data: cities, error: cError } = await supabase
        .from('cities')
        .select('id, name')
        .eq('is_active', true);

    if (cError) {
        console.error('Error fetching cities:', cError.message);
        return;
    }

    console.log(`Found ${cities.length} active cities.`);

    // Sort cities by length descending so longer names ("Abu Dhabi") match before shorter ones ("Dubai")
    cities.sort((a, b) => b.name.length - a.name.length);

    console.log('Fetching clinics without city_id...');
    let totalUpdated = 0;
    let offset = 0;
    const limit = 1000;

    while (true) {
        const { data: clinics, error: currErr } = await supabase
            .from('clinics')
            .select('id, name, address')
            .is('city_id', null)
            .range(offset, offset + limit - 1);

        if (currErr) {
            console.error('Error fetching clinics:', currErr.message);
            break;
        }

        if (!clinics || clinics.length === 0) {
            break;
        }

        console.log(`Processing batch of ${clinics.length} clinics...`);

        const updates = [];
        for (const clinic of clinics) {
            const searchString = `${clinic.name} ${clinic.address || ''}`.toLowerCase();

            let matchedCityId = null;
            for (const city of cities) {
                if (searchString.includes(city.name.toLowerCase())) {
                    matchedCityId = city.id;
                    break;
                }
            }

            if (matchedCityId) {
                updates.push({
                    id: clinic.id,
                    city_id: matchedCityId
                });
            }
        }

        if (updates.length > 0) {
            // Supabase has no bulk update for REST API natively except single rows or upsert.
            // We'll use bulk upsert. Since we don't have all columns, we might need a more careful approach
            // Wait, bulk upsert requires all NOT NULL columns or defaults.
            // Actually, we can update one by one or in smaller batches.
            console.log(`Updating ${updates.length} clinics in this batch...`);
            for (let i = 0; i < updates.length; i++) {
                const u = updates[i];
                const { error: updErr } = await supabase
                    .from('clinics')
                    .update({ city_id: u.city_id })
                    .eq('id', u.id);

                if (updErr) {
                    console.error(`Error updating clinic ${u.id}:`, updErr.message);
                } else {
                    totalUpdated++;
                    if (totalUpdated % 100 === 0) console.log(`${totalUpdated} clinics updated...`);
                }
            }
        }

        offset += limit;
    }

    console.log(`Finished mapping! Total updated: ${totalUpdated}`);
}

main().catch(console.error);
