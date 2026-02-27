import{u}from"./chunk-CPh6voF3.js";import{u as a,s as c}from"./index-DflORfjh.js";function d(){const{user:e,isDentist:s,isAdmin:t,isSuperAdmin:r}=a();return u({queryKey:["dentist-clinic",e?.id],queryFn:async()=>{if(!e?.id)return null;const{data:n,error:i}=await c.from("clinics").select(`
          *,
          city:cities(id, name, slug, state:states(id, name, slug))
        `).eq("claimed_by",e.id).maybeSingle();if(i)throw console.error("Error fetching dentist clinic:",i),i;return n},enabled:!!e?.id&&s&&!t&&!r,staleTime:5*60*1e3})}export{d as u};
