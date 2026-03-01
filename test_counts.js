import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = 'http://localhost:3000/api/sb-proxy/';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCounts() {
    console.log("Fetching active states...");
    const { data: activeStates, error: stateErr } = await supabase
        .from('states')
        .select('id')
        .eq('is_active', true);

    if (stateErr) {
        console.error("State Error:", stateErr.message);
        return;
    }
    const activeStateIds = activeStates.map(s => s.id);
    console.log(`Found ${activeStateIds.length} active states.`);

    console.log("Fetching active cities...");
    const { data: activeCities, error: cityErr } = await supabase
        .from('cities')
        .select('id')
        .eq('is_active', true)
        .in('state_id', activeStateIds);

    if (cityErr) {
        console.error("City Error:", cityErr.message);
        return;
    }
    const activeCityIds = activeCities.map(c => c.id);
    console.log(`Found ${activeCityIds.length} active cities.`);

    console.log("Fetching clinic count...");
    const { count: cCount, error: clinicErr } = await supabase
        .from('clinics')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .in('city_id', activeCityIds);

    if (clinicErr) {
        console.error("Clinic Error:", clinicErr.message);
        return;
    }
    console.log(`Clinic count: ${cCount}`);
}

testCounts().catch(console.error);
