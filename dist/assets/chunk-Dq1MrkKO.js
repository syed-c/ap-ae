import{u as l}from"./chunk-CPh6voF3.js";import{u as c,s}from"./index-DflORfjh.js";const f=["free","verified_presence","growth_engine","autopilot_growth"];function y(e){if(!e)return 0;const r=f.indexOf(e);return r===-1?0:r}function o(e){const{user:r}=c();return l({queryKey:["clinic-subscription",e],queryFn:async()=>{if(!e)return null;const{data:a,error:t}=await s.from("clinic_subscriptions").select(`
          id,
          plan_id,
          status,
          expires_at,
          billing_cycle,
          amount_paid,
          plan:subscription_plans(id, name, slug, description, price_monthly, price_yearly, billing_period)
        `).eq("clinic_id",e).eq("status","active").maybeSingle();if(t)throw t;return a},enabled:!!e&&!!r})}function _(e){const{data:r}=o(e);return l({queryKey:["clinic-features",r?.plan_id],queryFn:async()=>{if(!r?.plan_id){const{data:i}=await s.from("subscription_plans").select("id").eq("slug","free").single();if(!i)return[];const{data:n,error:u}=await s.from("plan_features").select("feature_key, is_enabled, usage_limit").eq("plan_id",i.id);if(u)throw u;return n}const{data:a,error:t}=await s.from("plan_features").select("feature_key, is_enabled, usage_limit").eq("plan_id",r.plan_id);if(t)throw t;return a},enabled:!0})}function b(e,r){const{data:a,isLoading:t}=_(e),{data:i}=o(e);if(t||!a||!r)return{hasAccess:!1,isLoading:t,usageLimit:null,currentPlan:null};const n=a.find(u=>u.feature_key===r);return{hasAccess:n?.is_enabled??!1,isLoading:!1,usageLimit:n?.usage_limit??null,currentPlan:i?.plan?.slug??"free"}}function g(){return l({queryKey:["subscription-plans"],queryFn:async()=>{const{data:e,error:r}=await s.from("subscription_plans").select(`
          *,
          features:plan_features(feature_key, is_enabled, usage_limit)
        `).eq("is_active",!0).order("display_order");if(r)throw r;return e}})}export{b as a,g as b,y as g,o as u};
