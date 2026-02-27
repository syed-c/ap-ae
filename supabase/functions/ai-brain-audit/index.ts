import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, scope } = await req.json();

    if (action === "full-audit") {
      return await handleFullAudit(supabase);
    } else if (action === "location-profiles") {
      return await handleScopedAudit(supabase, 'locations');
    } else if (action === "service-location") {
      return await handleScopedAudit(supabase, 'service-location');
    } else if (action === "clinics") {
      return await handleScopedAudit(supabase, 'clinics');
    } else if (action === "seo-pages") {
      return await handleScopedAudit(supabase, 'seo-pages');
    } else if (action === "blog") {
      return await handleScopedAudit(supabase, 'blog');
    } else if (action === "linking-audit") {
      return await handleLinkingAudit(supabase);
    } else if (action === "fix-internal-links") {
      return await handleFixLinks(supabase, scope);
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Brain audit error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleFullAudit(supabase: any) {
  const suggestions: any[] = [];

  // 1. Check clinic description coverage
  const { count: totalClinics } = await supabase
    .from("clinics").select("*", { count: "exact", head: true }).eq("is_active", true);
  const { count: clinicsNoDesc } = await supabase
    .from("clinics").select("*", { count: "exact", head: true }).eq("is_active", true).is("description", null);
  
  if ((clinicsNoDesc || 0) > 0) {
    suggestions.push({
      type: "content_gap",
      priority: (clinicsNoDesc || 0) > 100 ? "high" : "medium",
      title: `${clinicsNoDesc} clinics missing descriptions`,
      description: `Out of ${totalClinics} active clinics, ${clinicsNoDesc} have no description. This impacts SEO and user trust.`,
      actionLabel: "Go to Clinic Content",
      targetTab: "clinics",
    });
  }

  // 2. Check SEO page word counts
  const { data: thinPages } = await supabase
    .from("seo_pages")
    .select("slug, page_type, word_count")
    .lt("word_count", 500)
    .gt("word_count", 0)
    .limit(50);

  if (thinPages && thinPages.length > 0) {
    suggestions.push({
      type: "thin_content",
      priority: thinPages.length > 20 ? "high" : "medium",
      title: `${thinPages.length} SEO pages with thin content (<500 words)`,
      description: `These pages need expansion to meet search engine quality standards. Top types: ${[...new Set(thinPages.map((p: any) => p.page_type))].join(", ")}.`,
      actionLabel: "Go to Services",
      targetTab: "services",
    });
  }

  // 3. Check pages with no content at all
  const { count: emptyPages } = await supabase
    .from("seo_pages").select("*", { count: "exact", head: true })
    .or("word_count.is.null,word_count.eq.0");

  if ((emptyPages || 0) > 0) {
    suggestions.push({
      type: "missing_page",
      priority: "high",
      title: `${emptyPages} SEO pages with zero content`,
      description: "Empty pages can harm your domain authority. These need content generated immediately.",
      actionLabel: "Go to Services",
      targetTab: "services",
    });
  }

  // 4. Check blog coverage
  const { count: publishedBlogs } = await supabase
    .from("blog_posts").select("*", { count: "exact", head: true }).eq("status", "published");

  if ((publishedBlogs || 0) < 50) {
    suggestions.push({
      type: "topic_idea",
      priority: "medium",
      title: `Only ${publishedBlogs} blog posts published (target: 100+)`,
      description: "Blog content drives organic traffic. Consider generating posts for dental procedures, cost guides, and insurance topics specific to UAE.",
      actionLabel: "Go to Blog Engine",
      targetTab: "blog",
    });
  }

  // 5. Check treatment coverage per active city
  const { data: activeCities } = await supabase
    .from("cities").select("id, name").eq("is_active", true).limit(20);
  const { data: activeTreatments } = await supabase
    .from("treatments").select("id, name, slug").eq("is_active", true).limit(30);

  if (activeCities && activeTreatments) {
    const { data: existingServiceLocPages } = await supabase
      .from("seo_pages")
      .select("slug")
      .eq("page_type", "service_location");

    const existingSlugs = new Set((existingServiceLocPages || []).map((p: any) => p.slug));
    const totalPossible = activeCities.length * activeTreatments.length;
    const existing = existingSlugs.size;
    const missing = totalPossible - existing;

    if (missing > 10) {
      suggestions.push({
        type: "missing_page",
        priority: missing > 50 ? "high" : "medium",
        title: `${missing} service-location pages not yet created`,
        description: `Only ${existing}/${totalPossible} possible service+city combinations have pages. Creating these will massively expand your SEO footprint.`,
        actionLabel: "Go to Studio",
        targetTab: "studio",
      });
    }
  }

  // 6. Check FAQ coverage
  const { count: faqCount } = await supabase
    .from("faqs").select("*", { count: "exact", head: true }).eq("is_active", true);

  if ((faqCount || 0) < 50) {
    suggestions.push({
      type: "optimization",
      priority: "medium",
      title: `Only ${faqCount} FAQs active — aim for 200+`,
      description: "FAQ schema drives featured snippets in Google. Generate FAQs for each service and location combination.",
      actionLabel: "Go to FAQ Studio",
      targetTab: "faq",
    });
  }

  // 7. Check areas without clinics
  const { data: areasWithoutClinics } = await supabase
    .from("areas")
    .select("name, dentist_count")
    .eq("is_active", true)
    .eq("dentist_count", 0)
    .limit(20);

  if (areasWithoutClinics && areasWithoutClinics.length > 0) {
    suggestions.push({
      type: "content_gap",
      priority: "low",
      title: `${areasWithoutClinics.length} active areas have 0 dentists`,
      description: `Areas like ${areasWithoutClinics.slice(0, 3).map((a: any) => a.name).join(", ")} are active but show no dentists. Consider importing clinics or deactivating these areas.`,
      actionLabel: "View Locations",
      targetTab: "locations",
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a: any, b: any) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);

  return new Response(
    JSON.stringify({ suggestions, auditedAt: new Date().toISOString() }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleScopedAudit(supabase: any, scope: string) {
  const suggestions: any[] = [];

  if (scope === 'locations') {
    const { data: activeCities } = await supabase.from("cities").select("id, name, slug").eq("is_active", true).limit(50);
    const { data: activeStates } = await supabase.from("states").select("id, name, slug").eq("is_active", true).limit(20);
    const { data: locationPages } = await supabase.from("seo_pages").select("slug, page_type, word_count").in("page_type", ["state", "city"]);
    
    const statePages = (locationPages || []).filter((p: any) => p.page_type === "state");
    const cityPages = (locationPages || []).filter((p: any) => p.page_type === "city");
    
    if (statePages.length < (activeStates?.length || 0)) {
      suggestions.push({ type: "missing_page", priority: "high", title: `${(activeStates?.length || 0) - statePages.length} state pages missing`, description: "Create SEO pages for all active states/emirates.", actionLabel: "Go to Locations", targetTab: "locations" });
    }
    
    const thinLocationPages = (locationPages || []).filter((p: any) => p.word_count && p.word_count < 500);
    if (thinLocationPages.length > 0) {
      suggestions.push({ type: "thin_content", priority: "medium", title: `${thinLocationPages.length} location pages with thin content`, description: "Expand location pages with local dental information, area guides, and clinic highlights.", actionLabel: "Go to Locations", targetTab: "locations" });
    }
    
    const { data: areasNoClinics } = await supabase.from("areas").select("name").eq("is_active", true).eq("dentist_count", 0).limit(20);
    if (areasNoClinics && areasNoClinics.length > 0) {
      suggestions.push({ type: "content_gap", priority: "low", title: `${areasNoClinics.length} areas have 0 dentists`, description: `Areas like ${areasNoClinics.slice(0, 3).map((a: any) => a.name).join(", ")} are active but empty.`, actionLabel: "View Locations", targetTab: "locations" });
    }
  }

  if (scope === 'service-location') {
    const { data: activeCities } = await supabase.from("cities").select("id, name").eq("is_active", true).limit(20);
    const { data: activeTreatments } = await supabase.from("treatments").select("id, name, slug").eq("is_active", true).limit(30);
    const { data: existingPages } = await supabase.from("seo_pages").select("slug").eq("page_type", "service_location");
    
    const totalPossible = (activeCities?.length || 0) * (activeTreatments?.length || 0);
    const existing = existingPages?.length || 0;
    const missing = totalPossible - existing;
    
    suggestions.push({ type: "missing_page", priority: missing > 50 ? "high" : "medium", title: `${missing} service-location pages not yet created`, description: `Only ${existing}/${totalPossible} combinations have pages. Creating these will expand your SEO footprint.`, actionLabel: "Go to Studio", targetTab: "studio" });
    
    const { data: thinSL } = await supabase.from("seo_pages").select("slug, word_count").eq("page_type", "service_location").lt("word_count", 500).gt("word_count", 0).limit(50);
    if (thinSL && thinSL.length > 0) {
      suggestions.push({ type: "thin_content", priority: "medium", title: `${thinSL.length} service-location pages with thin content`, description: "These pages need expansion for competitive ranking.", actionLabel: "Go to Services", targetTab: "services" });
    }
  }

  if (scope === 'clinics') {
    const { count: totalClinics } = await supabase.from("clinics").select("*", { count: "exact", head: true }).eq("is_active", true);
    const { count: noDesc } = await supabase.from("clinics").select("*", { count: "exact", head: true }).eq("is_active", true).is("description", null);
    
    if ((noDesc || 0) > 0) {
      suggestions.push({ type: "content_gap", priority: (noDesc || 0) > 100 ? "high" : "medium", title: `${noDesc} clinics missing descriptions`, description: `Out of ${totalClinics} clinics, ${noDesc} have no description.`, actionLabel: "Go to Clinic Content", targetTab: "clinics" });
    }
  }

  if (scope === 'seo-pages') {
    const { data: thinPages } = await supabase.from("seo_pages").select("slug, page_type, word_count").lt("word_count", 500).gt("word_count", 0).limit(50);
    const { count: emptyPages } = await supabase.from("seo_pages").select("*", { count: "exact", head: true }).or("word_count.is.null,word_count.eq.0");
    const { count: missingMeta } = await supabase.from("seo_pages").select("*", { count: "exact", head: true }).or("meta_title.is.null,meta_description.is.null");
    
    if ((emptyPages || 0) > 0) suggestions.push({ type: "missing_page", priority: "high", title: `${emptyPages} pages with zero content`, description: "Empty pages harm domain authority.", actionLabel: "Go to Studio", targetTab: "studio" });
    if (thinPages && thinPages.length > 0) suggestions.push({ type: "thin_content", priority: "medium", title: `${thinPages.length} pages with thin content (<500 words)`, description: "Expand these for search quality standards.", actionLabel: "Go to Services", targetTab: "services" });
    if ((missingMeta || 0) > 0) suggestions.push({ type: "optimization", priority: "medium", title: `${missingMeta} pages missing meta tags`, description: "Add meta titles and descriptions for SEO.", actionLabel: "Go to Optimization", targetTab: "optimization" });
  }

  if (scope === 'blog') {
    const { count: published } = await supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("status", "published");
    const { count: drafts } = await supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("status", "draft");
    
    if ((published || 0) < 50) suggestions.push({ type: "topic_idea", priority: "medium", title: `Only ${published} blog posts published (target: 100+)`, description: "Blog content drives organic traffic. Generate posts for dental procedures and cost guides.", actionLabel: "Go to Blog", targetTab: "blog" });
    if ((drafts || 0) > 5) suggestions.push({ type: "optimization", priority: "low", title: `${drafts} draft blog posts waiting`, description: "Review and publish drafts to boost content volume.", actionLabel: "Go to Blog", targetTab: "blog" });
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a: any, b: any) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);

  return new Response(
    JSON.stringify({ suggestions, auditedAt: new Date().toISOString(), scope }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleLinkingAudit(supabase: any) {
  // Fetch all SEO pages
  const { data: seoPages } = await supabase
    .from("seo_pages")
    .select("id, slug, page_type, content, word_count")
    .order("slug")
    .limit(500);

  const { data: blogPosts } = await supabase
    .from("blog_posts")
    .select("id, slug, content, status")
    .eq("status", "published")
    .limit(200);

  const allPages = [
    ...(seoPages || []).map((p: any) => ({
      slug: p.slug,
      type: p.page_type,
      content: typeof p.content === "string" ? p.content : JSON.stringify(p.content || ""),
    })),
    ...(blogPosts || []).map((p: any) => ({
      slug: `blog/${p.slug}`,
      type: "blog",
      content: typeof p.content === "object" ? (p.content as any)?.body || "" : p.content || "",
    })),
  ];

  const allSlugs = new Set(allPages.map(p => p.slug));

  const results = allPages.map(page => {
    const content = (page.content || "").toLowerCase();
    
    // Count outbound links (simple heuristic: look for /slug patterns or href patterns)
    let outboundLinks = 0;
    let inboundLinks = 0;

    allPages.forEach(other => {
      if (other.slug === page.slug) return;
      // Check if this page links to other
      if (content.includes(`/${other.slug}`) || content.includes(`"${other.slug}"`)) {
        outboundLinks++;
      }
      // Check if other links to this page
      const otherContent = (other.content || "").toLowerCase();
      if (otherContent.includes(`/${page.slug}`) || otherContent.includes(`"${page.slug}"`)) {
        inboundLinks++;
      }
    });

    // Determine link types
    const slugParts = page.slug.split("/");
    const hasParentLink = slugParts.length > 1 
      ? content.includes(`/${slugParts.slice(0, -1).join("/")}`) 
      : content.includes('/"') || content.includes("/home");
    
    const hasChildLinks = allPages.some(other => 
      other.slug.startsWith(page.slug + "/") && content.includes(`/${other.slug}`)
    );

    const hasLateralLinks = outboundLinks >= 2;

    // Score: 0-100
    let score = 0;
    if (inboundLinks > 0) score += 30;
    if (inboundLinks >= 3) score += 10;
    if (outboundLinks >= 2) score += 20;
    if (hasParentLink) score += 15;
    if (hasChildLinks) score += 15;
    if (hasLateralLinks) score += 10;

    return {
      page_slug: page.slug,
      page_type: page.type,
      outbound_links: outboundLinks,
      inbound_links: inboundLinks,
      orphan: inboundLinks === 0,
      has_parent_link: hasParentLink,
      has_child_links: hasChildLinks,
      has_lateral_links: hasLateralLinks,
      score: Math.min(score, 100),
    };
  });

  return new Response(
    JSON.stringify({ results, auditedAt: new Date().toISOString() }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleFixLinks(supabase: any, scope: string) {
  const AIML_KEY = Deno.env.get("AIMLAPI_KEY");
  
  const auditResponse = await handleLinkingAudit(supabase);
  const auditData = await auditResponse.json();
  const results = auditData.results || [];

  const pagesToFix = scope === "orphans" 
    ? results.filter((r: any) => r.orphan)
    : results.filter((r: any) => r.score < 60);

  // Fetch treatments and cities for context
  const { data: treatments } = await supabase.from("treatments").select("name, slug").eq("is_active", true).limit(20);
  const { data: cities } = await supabase.from("cities").select("name, slug, state:states(slug, name)").eq("is_active", true).limit(50);

  let fixed = 0;
  for (const page of pagesToFix.slice(0, 50)) {
    try {
      if (page.page_type === "blog") continue;

      const { data: existingPage } = await supabase
        .from("seo_pages")
        .select("id, content, page_type, slug")
        .eq("slug", page.page_slug)
        .single();

      if (!existingPage) continue;
      
      const currentContent = existingPage.content || "";
      if (currentContent.includes("related-links") || currentContent.includes("Related Pages")) continue;

      // Build contextual links based on page type
      const slugParts = page.page_slug.split("/");
      const relatedLinks: { text: string; href: string }[] = [];

      if (page.page_type === "state" || page.page_type === "city") {
        // Add treatment links for location pages
        (treatments || []).slice(0, 4).forEach((t: any) => {
          if (slugParts[0] && slugParts[1]) {
            relatedLinks.push({ text: `${t.name} in ${slugParts[1].replace(/-/g, " ")}`, href: `/${slugParts[0]}/${slugParts[1]}/${t.slug}/` });
          } else if (slugParts[0]) {
            relatedLinks.push({ text: `${t.name} services`, href: `/services/${t.slug}/` });
          }
        });
        // Add sibling city/area links
        const siblingCities = (cities || []).filter((c: any) => c.state?.slug === slugParts[0] && c.slug !== slugParts[1]).slice(0, 3);
        siblingCities.forEach((c: any) => {
          relatedLinks.push({ text: `Dentists in ${c.name}`, href: `/${c.state?.slug}/${c.slug}/` });
        });
      } else if (page.page_type === "service_location") {
        // Add parent city link
        if (slugParts.length >= 2) {
          const cityName = slugParts[1].replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
          relatedLinks.push({ text: `All dentists in ${cityName}`, href: `/${slugParts[0]}/${slugParts[1]}/` });
        }
        // Add related services
        (treatments || []).filter((t: any) => t.slug !== slugParts[2]).slice(0, 3).forEach((t: any) => {
          if (slugParts[0] && slugParts[1]) {
            relatedLinks.push({ text: `${t.name} in ${slugParts[1].replace(/-/g, " ")}`, href: `/${slugParts[0]}/${slugParts[1]}/${t.slug}/` });
          }
        });
      } else if (page.page_type === "treatment" || page.page_type === "service") {
        // Add location links for service pages
        (cities || []).slice(0, 4).forEach((c: any) => {
          const treatmentSlug = slugParts[slugParts.length - 1];
          relatedLinks.push({ text: `${page.page_slug.split("/").pop()?.replace(/-/g, " ")} in ${c.name}`, href: `/${c.state?.slug}/${c.slug}/${treatmentSlug}/` });
        });
      }

      if (relatedLinks.length === 0) continue;

      // Use AI to generate natural anchor text if API key available
      let linksMarkdown = "";
      if (AIML_KEY && relatedLinks.length > 0) {
        try {
          const aiResp = await fetch("https://api.aimlapi.com/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${AIML_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "gemini-2.0-flash",
              messages: [{
                role: "user",
                content: `Generate a short "Related Pages" paragraph (2-3 sentences max) that naturally includes these internal links for a dental directory page about "${page.page_slug}". Use the exact URLs provided. Links: ${JSON.stringify(relatedLinks.slice(0, 5))}. Return ONLY markdown with proper [text](url) links. No headings.`
              }],
            }),
          });
          if (aiResp.ok) {
            const aiData = await aiResp.json();
            linksMarkdown = aiData.choices?.[0]?.message?.content?.trim() || "";
          }
        } catch { /* fallback below */ }
      }

      if (!linksMarkdown) {
        // Fallback: simple markdown links
        const linksList = relatedLinks.slice(0, 5).map(l => `[${l.text}](${l.href})`).join(" · ");
        linksMarkdown = `Explore more: ${linksList}`;
      }

      const relatedSection = `\n\n### Related Pages\n\n${linksMarkdown}`;

      await supabase
        .from("seo_pages")
        .update({ content: currentContent + relatedSection, updated_at: new Date().toISOString() })
        .eq("id", existingPage.id);
      fixed++;
    } catch (err) {
      console.error(`Failed to fix links for ${page.page_slug}:`, err);
    }
  }

  return new Response(
    JSON.stringify({ fixed, totalEligible: pagesToFix.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
