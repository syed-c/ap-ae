import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// UAE City/Area coordinates database
// Organized by Emirate → City/Area name → coordinates
const UAE_CITY_COORDINATES: Record<string, Record<string, { lat: number; lng: number }>> = {
  "Dubai": {
    "Dubai": { lat: 25.2048, lng: 55.2708 },
    "Jumeirah": { lat: 25.2108, lng: 55.2539 },
    "Deira": { lat: 25.2697, lng: 55.3095 },
    "Bur Dubai": { lat: 25.2532, lng: 55.2945 },
    "Dubai Marina": { lat: 25.0805, lng: 55.1403 },
    "Downtown Dubai": { lat: 25.1972, lng: 55.2744 },
    "Business Bay": { lat: 25.1851, lng: 55.2680 },
    "JBR": { lat: 25.0780, lng: 55.1330 },
    "Al Barsha": { lat: 25.1136, lng: 55.1954 },
    "Al Quoz": { lat: 25.1386, lng: 55.2310 },
    "Karama": { lat: 25.2447, lng: 55.3013 },
    "Satwa": { lat: 25.2271, lng: 55.2637 },
    "Jebel Ali": { lat: 25.0068, lng: 55.0721 },
    "Al Nahda": { lat: 25.2961, lng: 55.3685 },
    "International City": { lat: 25.1580, lng: 55.4045 },
    "Silicon Oasis": { lat: 25.1232, lng: 55.3801 },
    "Sports City": { lat: 25.0440, lng: 55.2172 },
    "Motor City": { lat: 25.0484, lng: 55.2369 },
    "Discovery Gardens": { lat: 25.0372, lng: 55.1498 },
    "Palm Jumeirah": { lat: 25.1124, lng: 55.1390 },
    "JLT": { lat: 25.0750, lng: 55.1530 },
    "DIFC": { lat: 25.2098, lng: 55.2795 },
    "Healthcare City": { lat: 25.2270, lng: 55.3210 },
    "Mirdif": { lat: 25.2200, lng: 55.4185 },
    "Al Rashidiya": { lat: 25.2378, lng: 55.3937 },
    "Al Mamzar": { lat: 25.2830, lng: 55.3430 },
    "Oud Metha": { lat: 25.2350, lng: 55.3100 },
    "Al Garhoud": { lat: 25.2340, lng: 55.3485 },
    "Jumeirah Village Circle": { lat: 25.0558, lng: 55.2144 },
    "Arabian Ranches": { lat: 25.0640, lng: 55.2677 },
    "Dubai Hills": { lat: 25.1060, lng: 55.2428 },
    "Creek Harbour": { lat: 25.1940, lng: 55.3414 },
    "Dubailand": { lat: 25.0800, lng: 55.3120 },
    "Al Warqa": { lat: 25.1940, lng: 55.4000 },
    "Umm Suqeim": { lat: 25.1360, lng: 55.2000 },
    "Al Safa": { lat: 25.1730, lng: 55.2370 },
    "Jumeirah Beach Residence": { lat: 25.0780, lng: 55.1330 },
    "The Greens": { lat: 25.0525, lng: 55.1785 },
    "Tecom": { lat: 25.0984, lng: 55.1732 },
    "Media City": { lat: 25.0955, lng: 55.1558 },
    "Internet City": { lat: 25.0983, lng: 55.1583 },
    "Knowledge Village": { lat: 25.1017, lng: 55.1546 },
  },
  "Abu Dhabi": {
    "Abu Dhabi": { lat: 24.4539, lng: 54.3773 },
    "Al Reem Island": { lat: 24.4955, lng: 54.4059 },
    "Saadiyat Island": { lat: 24.5418, lng: 54.4381 },
    "Yas Island": { lat: 24.4887, lng: 54.6018 },
    "Khalifa City": { lat: 24.4208, lng: 54.5725 },
    "Al Ain": { lat: 24.1915, lng: 55.7606 },
    "Mussafah": { lat: 24.3500, lng: 54.4833 },
    "Corniche": { lat: 24.4616, lng: 54.3278 },
    "Al Khalidiyah": { lat: 24.4700, lng: 54.3459 },
    "Tourist Club Area": { lat: 24.4880, lng: 54.3663 },
    "Al Mushrif": { lat: 24.4460, lng: 54.3960 },
    "Al Bateen": { lat: 24.4600, lng: 54.3510 },
    "Hamdan Street": { lat: 24.4840, lng: 54.3600 },
    "Electra Street": { lat: 24.4870, lng: 54.3700 },
    "Al Muroor": { lat: 24.4560, lng: 54.3920 },
    "Al Shamkha": { lat: 24.3700, lng: 54.7580 },
    "Mohammed Bin Zayed City": { lat: 24.3498, lng: 54.5478 },
    "Al Reef": { lat: 24.4370, lng: 54.6930 },
    "Al Raha Beach": { lat: 24.4590, lng: 54.6050 },
    "Al Maryah Island": { lat: 24.5020, lng: 54.3932 },
    "Masdar City": { lat: 24.4285, lng: 54.6165 },
    "Al Dhafra": { lat: 23.6500, lng: 53.7000 },
    "Madinat Zayed": { lat: 23.6598, lng: 53.7030 },
    "Baniyas": { lat: 24.3100, lng: 54.6400 },
    "Shahama": { lat: 24.5550, lng: 54.6730 },
  },
  "Sharjah": {
    "Sharjah": { lat: 25.3573, lng: 55.4033 },
    "Al Nahda Sharjah": { lat: 25.3050, lng: 55.3730 },
    "Al Majaz": { lat: 25.3290, lng: 55.3880 },
    "Al Khan": { lat: 25.3280, lng: 55.3740 },
    "Al Qasimia": { lat: 25.3530, lng: 55.3930 },
    "Al Taawun": { lat: 25.3115, lng: 55.3780 },
    "Muwaileh": { lat: 25.3150, lng: 55.4450 },
    "Al Wahda": { lat: 25.3640, lng: 55.3870 },
    "University City": { lat: 25.2990, lng: 55.4560 },
    "Industrial Area": { lat: 25.2950, lng: 55.4330 },
    "Rolla": { lat: 25.3530, lng: 55.3870 },
    "Abu Shagara": { lat: 25.3380, lng: 55.3900 },
    "Corniche Sharjah": { lat: 25.3560, lng: 55.3770 },
    "Kalba": { lat: 25.0691, lng: 56.3488 },
    "Khor Fakkan": { lat: 25.3326, lng: 56.3548 },
    "Dibba Al Hisn": { lat: 25.6169, lng: 56.2626 },
  },
  "Ajman": {
    "Ajman": { lat: 25.4052, lng: 55.5136 },
    "Al Nuaimia": { lat: 25.3940, lng: 55.4760 },
    "Al Rashidiya Ajman": { lat: 25.4090, lng: 55.4730 },
    "Al Jurf": { lat: 25.3780, lng: 55.5210 },
    "Emirates City": { lat: 25.4210, lng: 55.5120 },
    "Ajman Downtown": { lat: 25.4112, lng: 55.4350 },
    "Corniche Ajman": { lat: 25.4150, lng: 55.4320 },
    "Al Rawda": { lat: 25.3870, lng: 55.4540 },
    "Musheiref": { lat: 25.4060, lng: 55.4530 },
  },
  "Ras Al Khaimah": {
    "Ras Al Khaimah": { lat: 25.7895, lng: 55.9432 },
    "Al Nakheel": { lat: 25.7750, lng: 55.9560 },
    "Al Hamra": { lat: 25.6950, lng: 55.7870 },
    "Khuzam": { lat: 25.7530, lng: 55.9650 },
    "Julphar": { lat: 25.7885, lng: 55.9530 },
    "Al Dhait": { lat: 25.7350, lng: 55.9640 },
    "Corniche RAK": { lat: 25.7830, lng: 55.9480 },
    "Al Marjan Island": { lat: 25.7410, lng: 55.7920 },
  },
  "Fujairah": {
    "Fujairah": { lat: 25.1288, lng: 56.3265 },
    "Fujairah City": { lat: 25.1288, lng: 56.3265 },
    "Dibba": { lat: 25.5922, lng: 56.2607 },
    "Merashid": { lat: 25.1230, lng: 56.3530 },
    "Al Faseel": { lat: 25.1370, lng: 56.3290 },
    "Corniche Fujairah": { lat: 25.1200, lng: 56.3350 },
  },
  "Umm Al Quwain": {
    "Umm Al Quwain": { lat: 25.5647, lng: 55.5553 },
    "UAQ City": { lat: 25.5647, lng: 55.5553 },
    "Old Town UAQ": { lat: 25.5700, lng: 55.5550 },
    "New Industrial": { lat: 25.5410, lng: 55.5970 },
    "Corniche UAQ": { lat: 25.5650, lng: 55.5490 },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, stateId } = await req.json();

    if (action === "geocode-cities") {
      // Add coordinates to all cities/areas that don't have them
      const { data: cities, error: citiesError } = await supabase
        .from("cities")
        .select("id, name, state:states(name)")
        .is("latitude", null)
        .eq("is_active", true);

      if (citiesError) throw citiesError;

      let updated = 0;
      let notFound = 0;
      const notFoundCities: string[] = [];

      for (const city of cities || []) {
        const stateData = city.state as unknown as { name: string } | null;
        const emirateName = stateData?.name;
        if (!emirateName) {
          notFound++;
          notFoundCities.push(`${city.name} (no emirate)`);
          continue;
        }

        // Try to find coordinates: first exact match, then fuzzy
        let coords: { lat: number; lng: number } | null = null;

        // Check the emirate's coordinate map
        const emirateCoords = UAE_CITY_COORDINATES[emirateName];
        if (emirateCoords) {
          coords = emirateCoords[city.name] || null;

          // Fuzzy match: try case-insensitive and partial
          if (!coords) {
            const cityLower = city.name.toLowerCase();
            for (const [key, val] of Object.entries(emirateCoords)) {
              if (key.toLowerCase() === cityLower || key.toLowerCase().includes(cityLower) || cityLower.includes(key.toLowerCase())) {
                coords = val;
                break;
              }
            }
          }
        }

        // Fallback: search across all emirates
        if (!coords) {
          for (const [, emirateMap] of Object.entries(UAE_CITY_COORDINATES)) {
            if (emirateMap[city.name]) {
              coords = emirateMap[city.name];
              break;
            }
          }
        }

        if (coords) {
          await supabase
            .from("cities")
            .update({ latitude: coords.lat, longitude: coords.lng })
            .eq("id", city.id);
          updated++;
        } else {
          notFound++;
          notFoundCities.push(`${city.name}, ${emirateName}`);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          updated,
          notFound,
          notFoundCities: notFoundCities.slice(0, 50),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "redistribute-clinics") {
      // Get cities with coordinates
      let citiesQuery = supabase
        .from("cities")
        .select("id, name, latitude, longitude, state_id")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .eq("is_active", true);
      
      if (stateId) {
        citiesQuery = citiesQuery.eq("state_id", stateId);
      }

      const { data: cities, error: citiesError } = await citiesQuery;
      if (citiesError) throw citiesError;

      if (!cities || cities.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "No areas with coordinates found. Run geocode first.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch ALL clinics with coordinates using pagination
      console.log("Fetching all clinics with pagination...");
      const allClinics: any[] = [];
      const pageSize = 1000;
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: clinicBatch, error: clinicsError } = await supabase
          .from("clinics")
          .select("id, name, latitude, longitude, city_id, city:cities(name, state_id)")
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .eq("is_active", true)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (clinicsError) throw clinicsError;

        if (clinicBatch && clinicBatch.length > 0) {
          allClinics.push(...clinicBatch);
          console.log(`Fetched page ${page + 1}: ${clinicBatch.length} clinics (total: ${allClinics.length})`);
          hasMore = clinicBatch.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      console.log(`Total clinics fetched: ${allClinics.length}`);

      let reassigned = 0;
      let unchanged = 0;
      const changes: Array<{ clinic: string; from: string; to: string; distance: number }> = [];

      // Haversine distance function (km)
      const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      };

      // Process in batches
      const batchSize = 100;
      for (let i = 0; i < allClinics.length; i += batchSize) {
        const batch = allClinics.slice(i, i + batchSize);
        
        const updatePromises = batch.map(async (clinic) => {
          const cityData = clinic.city as unknown as { name: string; state_id: string } | null;
          const clinicStateId = cityData?.state_id;
          
          // Find nearest area/city in same emirate
          let nearestCity: typeof cities[0] | null = null;
          let minDistance = Infinity;

          for (const city of cities) {
            // Prefer same emirate, but allow cross-emirate if no match
            if (clinicStateId && city.state_id !== clinicStateId) continue;
            
            const distance = haversine(
              Number(clinic.latitude),
              Number(clinic.longitude),
              Number(city.latitude),
              Number(city.longitude)
            );
            
            if (distance < minDistance) {
              minDistance = distance;
              nearestCity = city;
            }
          }

          // If no match in same emirate, search all
          if (!nearestCity) {
            for (const city of cities) {
              const distance = haversine(
                Number(clinic.latitude),
                Number(clinic.longitude),
                Number(city.latitude),
                Number(city.longitude)
              );
              if (distance < minDistance) {
                minDistance = distance;
                nearestCity = city;
              }
            }
          }

          if (nearestCity && nearestCity.id !== clinic.city_id) {
            await supabase
              .from("clinics")
              .update({ city_id: nearestCity.id, updated_at: new Date().toISOString() })
              .eq("id", clinic.id);
            
            return { 
              reassigned: true, 
              change: changes.length < 100 ? {
                clinic: clinic.name,
                from: cityData?.name || "Unknown",
                to: nearestCity.name,
                distance: Math.round(minDistance * 10) / 10,
              } : null
            };
          } else {
            return { reassigned: false, change: null };
          }
        });

        const results = await Promise.all(updatePromises);
        for (const result of results) {
          if (result.reassigned) {
            reassigned++;
            if (result.change) changes.push(result.change);
          } else {
            unchanged++;
          }
        }
      }

      // Update dentist_count on cities
      try {
        await supabase.rpc("update_city_dentist_counts");
      } catch (e) {
        console.log("update_city_dentist_counts RPC not found, skipping");
      }

      return new Response(
        JSON.stringify({
          success: true,
          reassigned,
          unchanged,
          totalProcessed: allClinics.length,
          sampleChanges: changes.slice(0, 50),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "stats") {
      const { count: totalCities } = await supabase
        .from("cities")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      const { count: citiesWithCoords } = await supabase
        .from("cities")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      const { count: totalClinics } = await supabase
        .from("clinics")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      const { count: clinicsWithCoords } = await supabase
        .from("clinics")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      return new Response(
        JSON.stringify({
          cities: {
            total: totalCities || 0,
            withCoordinates: citiesWithCoords || 0,
            withoutCoordinates: (totalCities || 0) - (citiesWithCoords || 0),
          },
          clinics: {
            total: totalClinics || 0,
            withCoordinates: clinicsWithCoords || 0,
            withoutCoordinates: (totalClinics || 0) - (clinicsWithCoords || 0),
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
