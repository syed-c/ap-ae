import{u as n}from"./chunk-CPh6voF3.js";import{s}from"./index-DflORfjh.js";function o(e){return n({queryKey:["service-price-ranges",e],queryFn:async()=>{let r=s.from("service_price_ranges").select(`
          *,
          state:states(id, name, slug, abbreviation),
          treatment:treatments(id, name, slug)
        `).eq("is_active",!0).order("price_min");if(e){const{data:a}=await s.from("treatments").select("id").eq("slug",e).maybeSingle();a&&(r=r.eq("treatment_id",a.id))}const{data:i,error:t}=await r;if(t)throw t;return i||[]},enabled:!0})}export{o as u};
