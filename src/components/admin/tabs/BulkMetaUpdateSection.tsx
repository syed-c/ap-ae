import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Play, Square, Loader2, Check, X, AlertCircle, RefreshCw, Settings, Eye, Save } from "lucide-react";
import { toast } from "sonner";

interface PageType {
  id: string;
  name: string;
  slug: string;
}

interface PageStats {
  total: number;
  withTitle: number;
  withoutTitle: number;
  withDescription: number;
  withoutDescription: number;
}

interface BulkMetaConfig {
  page_type: string;
  title_template: string;
  description_template: string;
  include_year: boolean;
  include_location: boolean;
  include_action_word: boolean;
}

// Default templates for each page type - optimized for CTR (both mobile & desktop)
// Desktop shows ~155-160 chars, mobile ~120 chars - we optimize for both

const DEFAULT_TEMPLATES: Record<string, { title: string; description: string }> = {
  "state": {
    title: "Best Dentists in {{state}}, UAE ({{year}}) — Book Online Today",
    description: "Compare 6,600+ verified DHA-licensed dentists across {{state}}, UAE. Read 50,000+ real patient reviews, see transparent AED pricing for implants, braces, veneers. Book appointments instantly with top-rated dental professionals. Your perfect smile starts here."
  },
  "city": {
    title: "Best Dentists in {{city}}, {{state}} ({{year}}) — Compare 200+ Clinics",
    description: "Find the best dentists in {{city}}, {{state}}. Compare 200+ verified dental clinics with 4.9+ star ratings. Read real patient reviews, check AED prices for implants, whitening, invisalign. Book your appointment online in minutes. Free consultation available."
  },
  "service": {
    title: "{{service}} in UAE ({{year}}) — Find Top Dentists & Book Online",
    description: "Get {{service}} treatment in UAE. Compare 200+ verified specialists across Dubai, Abu Dhabi, Sharjah. Read patient reviews, see transparent AED pricing, check dentist credentials (BDS, MDS, DHA-licensed). Book your appointment instantly. Most clinics offer free consultation."
  },
  "service-location": {
    title: "{{service}} in {{city}} ({{year}}) — Find Top-Rated Dentists Near You",
    description: "Need {{service}} in {{city}}? Compare 50+ verified specialists near you. Read patient reviews, check ratings (4.9+ stars), see transparent AED pricing. Book your appointment in minutes. All dentists are DHA/DOH-licensed. Free consultation available."
  },
  "clinic": {
    title: "{{clinic}} - Top-Rated Dental Clinic in {{city}} ({{year}})",
    description: "Book at {{clinic}} — one of the top-rated dental clinics in {{city}}, {{state}}. Our 500+ verified patient reviews show 4.9+ star satisfaction. We offer transparent AED pricing, modern equipment, and DHA-licensed dentists. Book your visit online in 30 seconds."
  },
  "dentist": {
    title: "{{dentist}} - Dentist in {{city}} ({{year}}) — Book Appointment",
    description: "Book an appointment with {{dentist}} — a highly rated dentist in {{city}}, {{state}}. With 100+ verified patient reviews and 4.9+ stars, specializing in modern dental techniques. DHA-licensed. Book your appointment instantly."
  }
};

function BulkMetaUpdateSection() {
  const queryClient = useQueryClient();
  const logsRef = useRef<HTMLDivElement>(null);
  
  // Configuration state
  const [config, setConfig] = useState<BulkMetaConfig>({
    page_type: "all",
    title_template: "",
    description_template: "",
    include_year: true,
    include_location: true,
    include_action_word: true,
  });
  
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedPageType, setSelectedPageType] = useState("state");
  
  // Auto-scroll logs
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  // Fetch page type options
  const { data: pageTypeStats } = useQuery({
    queryKey: ["bulk-meta-stats"],
    queryFn: async () => {
      const { data: pages, error } = await supabase
        .from("seo_pages")
        .select("slug, meta_title, meta_description")
        .limit(1000);
      
      if (error) throw error;
      
      const stats: Record<string, PageStats> = {
        state: { total: 0, withTitle: 0, withoutTitle: 0, withDescription: 0, withoutDescription: 0 },
        city: { total: 0, withTitle: 0, withoutTitle: 0, withDescription: 0, withoutDescription: 0 },
        service: { total: 0, withTitle: 0, withoutTitle: 0, withDescription: 0, withoutDescription: 0 },
        "service-location": { total: 0, withTitle: 0, withoutTitle: 0, withDescription: 0, withoutDescription: 0 },
        clinic: { total: 0, withTitle: 0, withoutTitle: 0, withDescription: 0, withoutDescription: 0 },
        dentist: { total: 0, withTitle: 0, withoutTitle: 0, withDescription: 0, withoutDescription: 0 },
      };
      
      (pages || []).forEach(page => {
        const type = getPageTypeFromSlug(page.slug);
        if (type && stats[type]) {
          stats[type].total++;
          if (page.meta_title) stats[type].withTitle++;
          else stats[type].withoutTitle++;
          if (page.meta_description) stats[type].withDescription++;
          else stats[type].withoutDescription++;
        }
      });
      
      return stats;
    },
  });

  // Get states/cities/services for template variables
  const { data: locations } = useQuery({
    queryKey: ["bulk-meta-locations"],
    queryFn: async () => {
      const [states, cities, treatments, clinics, dentists] = await Promise.all([
        supabase.from("states").select("id, name, slug").eq("is_active", true).order("name"),
        supabase.from("cities").select("id, name, slug, state_id").eq("is_active", true).limit(100),
        supabase.from("treatments").select("id, name, slug").eq("is_active", true).order("name"),
        supabase.from("clinics").select("id, name, slug").eq("is_active", true).limit(100),
        supabase.from("dentists").select("id, name, slug").eq("is_active", true).limit(100),
      ]);
      
      return {
        states: states.data || [],
        cities: cities.data || [],
        treatments: treatments.data || [],
        clinics: clinics.data || [],
        dentists: dentists.data || [],
      };
    },
  });

  // Determine page type from slug
  function getPageTypeFromSlug(slug: string): string | null {
    if (slug.startsWith("/services/")) return "service";
    if (slug.startsWith("/clinic/")) return "clinic";
    if (slug.startsWith("/dentist/")) return "dentist";
    if (slug.includes("/") && slug.split("/").length >= 3) return "service-location";
    if (slug.includes("/") && slug.split("/").length === 2) return "city";
    if (!slug.includes("/") && slug !== "services" && slug !== "about" && slug !== "contact") return "state";
    return null;
  }

  // Apply template with variables - smart parsing based on page type
  function applyTemplate(template: string, page: any, type: string): string {
    let result = template;
    const year = "2026";
    
    // Parse slug to extract variables
    const slugParts = (page.slug || "").split("/").filter(Boolean);
    
    const state = slugParts[0] || "UAE";
    const city = slugParts[1] || "";
    const service = slugParts[2] || slugParts[1] || "";
    const clinic = page.clinic_name || "";
    const dentist = page.dentist_name || "";
    
    // Replace variables
    result = result.replace(/{{year}}/g, year);
    result = result.replace(/{{state}}/g, formatName(state));
    result = result.replace(/{{city}}/g, formatName(city));
    result = result.replace(/{{service}}/g, formatName(service));
    result = result.replace(/{{clinic}}/g, clinic || "Dental Clinic");
    result = result.replace(/{{dentist}}/g, dentist || "Dentist");
    result = result.replace(/{{title}}/g, page.dentist_title || "Dentist");
    
    // Add action words if enabled
    if (config.include_action_word && !result.includes("Book") && !result.includes("Compare") && !result.includes("Find")) {
      if (type === "service") result = "Compare " + result;
      else if (type === "clinic" || type === "dentist") result = "Book " + result;
      else result = result;
    }
    
    return result;
  }
  
  // Format slug to readable name
  function formatName(slug: string): string {
    if (!slug) return "";
    return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  // Preview the changes
  const handlePreview = async () => {
    setIsPreviewLoading(true);
    setPreviewData([]);
    
    try {
      let query = supabase
        .from("seo_pages")
        .select("id, slug, meta_title, meta_description, page_type")
        .limit(20);
      
      if (config.page_type !== "all") {
        query = query.like("slug", `%${config.page_type}%`);
      }
      
      const { data: pages, error } = await query;
      
      if (error) throw error;
      
      const templates = DEFAULT_TEMPLATES[config.page_type] || DEFAULT_TEMPLATES["state"];
      const titleTemplate = config.title_template || templates.title;
      const descTemplate = config.description_template || templates.description;
      
      const preview = (pages || []).map(page => {
        const type = getPageTypeFromSlug(page.slug) || config.page_type;
        return {
          id: page.id,
          slug: page.slug,
          current_title: page.meta_title || "(none)",
          new_title: applyTemplate(titleTemplate, { state: page.slug.split("/")[1], city: page.slug.split("/")[1], service: page.slug.split("/").pop() }, type),
          current_description: page.meta_description ? page.meta_description.substring(0, 60) + "..." : "(none)",
          new_description: applyTemplate(descTemplate, { state: page.slug.split("/")[1], city: page.slug.split("/")[1], service: page.slug.split("/").pop() }, type).substring(0, 60) + "...",
        };
      });
      
      setPreviewData(preview);
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Preview loaded ${preview.length} pages`]);
    } catch (err) {
      toast.error("Failed to load preview");
      setLogs((prev) => [...prev, `[ERROR] Failed to load preview: ${err}`]);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Run bulk update
  const handleBulkUpdate = async () => {
    setIsRunning(true);
    setLogs([]);
    
    try {
      const templates = DEFAULT_TEMPLATES[config.page_type] || DEFAULT_TEMPLATES["state"];
      const titleTemplate = config.title_template || templates.title;
      const descTemplate = config.description_template || templates.description;
      
      // Get all pages for the selected type
      let query = supabase
        .from("seo_pages")
        .select("id, slug");
      
      if (config.page_type !== "all") {
        if (config.page_type === "service") {
          query = query.like("slug", "/services/%");
        } else if (config.page_type === "state") {
          query = query.not("slug", "like", "/%/%");
        } else if (config.page_type === "city") {
          query = query.like("slug", "/%/%").not("slug", "like", "/%/%/%");
        }
      }
      
      const { data: pages, error } = await query;
      
      if (error) throw error;
      
      const totalPages = (pages || []).length;
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Found ${totalPages} pages to update`]);
      
      let successCount = 0;
      let errorCount = 0;
      const batchSize = 50;
      
      for (let i = 0; i < (pages || []).length; i += batchSize) {
        const batch = (pages || []).slice(i, i + batchSize);
        
        // Build updates with proper slug parsing
        const updates = batch.map(page => {
          const type = getPageTypeFromSlug(page.slug);
          const slugParts = page.slug.split("/").filter(Boolean);
          
          // Determine page type and extract variables
          let pageData: any = { slug: page.slug };
          
          if (type === "state") {
            pageData.state = slugParts[0] || "UAE";
            pageData.city = "";
            pageData.service = "";
          } else if (type === "city") {
            pageData.state = slugParts[0] || "UAE";
            pageData.city = slugParts[1] || "";
            pageData.service = "";
          } else if (type === "service-location") {
            pageData.state = slugParts[0] || "UAE";
            pageData.city = slugParts[1] || "";
            pageData.service = slugParts[2] || "";
          } else if (type === "service") {
            pageData.state = "UAE";
            pageData.city = "";
            pageData.service = slugParts[1] || "";
          } else if (type === "clinic") {
            pageData.state = slugParts[0] || "UAE";
            pageData.city = "";
            pageData.service = "";
          } else if (type === "dentist") {
            pageData.state = slugParts[0] || "UAE";
            pageData.city = "";
            pageData.service = "";
          }
          
          return {
            id: page.id,
            meta_title: applyTemplate(titleTemplate, { ...pageData, slug: page.slug }, type || config.page_type),
            meta_description: applyTemplate(descTemplate, { ...pageData, slug: page.slug }, type || config.page_type),
            updated_at: new Date().toISOString(),
          };
        });
        
        // Batch update using RPC function or individual updates
        // Since upsert requires all fields, use raw query via supabase
        for (const update of updates) {
          const { error: updateError } = await supabase
            .from("seo_pages")
            .update({
              meta_title: update.meta_title,
              meta_description: update.meta_description,
              updated_at: update.updated_at,
            })
            .eq("id", update.id);
          
          if (updateError) {
            errorCount++;
          } else {
            successCount++;
          }
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Complete! Updated ${successCount} pages, ${errorCount} errors`]);
      toast.success(`Updated ${successCount} pages`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["bulk-meta-stats"] });
      
    } catch (err) {
      setLogs((prev) => [...prev, `[ERROR] ${err}`]);
      toast.error("Bulk update failed");
    } finally {
      setIsRunning(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    const templates = DEFAULT_TEMPLATES[selectedPageType] || DEFAULT_TEMPLATES["state"];
    setConfig({
      ...config,
      page_type: selectedPageType,
      title_template: templates.title,
      description_template: templates.description,
    });
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Reset to defaults for ${selectedPageType}`]);
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Page Type</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={selectedPageType}
            onChange={(e) => {
              setSelectedPageType(e.target.value);
              const templates = DEFAULT_TEMPLATES[e.target.value] || DEFAULT_TEMPLATES["state"];
              setConfig({
                ...config,
                page_type: e.target.value,
                title_template: templates.title,
                description_template: templates.description,
              });
            }}
          >
            <option value="all">All Pages</option>
            <option value="state">States/Emirates</option>
            <option value="city">Cities/Areas</option>
            <option value="service">Services</option>
            <option value="service-location">Service-Location</option>
            <option value="clinic">Clinics</option>
            <option value="dentist">Dentists</option>
          </select>
          
          {/* Stats display */}
          {pageTypeStats && selectedPageType !== "all" && (
            <div className="mt-2 text-xs text-muted-foreground">
              Total: {pageTypeStats[selectedPageType]?.total || 0} | 
              With Title: {pageTypeStats[selectedPageType]?.withTitle || 0} | 
              Without: {pageTypeStats[selectedPageType]?.withoutTitle || 0}
            </div>
          )}
        </div>
        
        <div className="flex items-end gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-muted"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Title Template</label>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2 font-mono text-sm"
            value={config.title_template || DEFAULT_TEMPLATES[selectedPageType]?.title || ""}
            onChange={(e) => setConfig({ ...config, title_template: e.target.value })}
            placeholder="Use {{state}}, {{city}}, {{service}}, {{year}} as variables"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Variables: {"{{state}}"}, {"{{city}}"}, {"{{service}}"}, {"{{clinic}}"}, {"{{dentist}}"}, {"{{year}}"}
          </p>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Description Template</label>
          <textarea
            className="w-full border rounded-md px-3 py-2 font-mono text-sm h-20"
            value={config.description_template || DEFAULT_TEMPLATES[selectedPageType]?.description || ""}
            onChange={(e) => setConfig({ ...config, description_template: e.target.value })}
            placeholder="Use {{state}}, {{city}}, {{service}}, {{year}} as variables"
          />
        </div>
        
        <div className="md:col-span-2 flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.include_year}
              onChange={(e) => setConfig({ ...config, include_year: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">Include Year (2026)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.include_action_word}
              onChange={(e) => setConfig({ ...config, include_action_word: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">Include Action Words</span>
          </label>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handlePreview}
          disabled={isPreviewLoading || isRunning}
          className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted disabled:opacity-50"
        >
          {isPreviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
          Preview Changes
        </button>
        
        <button
          onClick={handleBulkUpdate}
          disabled={isRunning || isPreviewLoading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isRunning ? "Updating..." : "Apply Bulk Update"}
        </button>
      </div>
      
      {/* Preview Table */}
      {previewData.length > 0 && (
        <div className="border rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Page</th>
                <th className="px-3 py-2 text-left">Current Title</th>
                <th className="px-3 py-2 text-left">New Title</th>
              </tr>
            </thead>
            <tbody>
              {previewData.slice(0, 10).map((page) => (
                <tr key={page.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{page.slug}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[150px]">{page.current_title}</td>
                  <td className="px-3 py-2 text-xs text-green-600 truncate max-w-[150px]">{page.new_title}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {previewData.length > 10 && (
            <div className="px-3 py-2 text-xs text-muted-foreground text-center">
              ... and {previewData.length - 10} more
            </div>
          )}
        </div>
      )}
      
      {/* Logs */}
      <div className="border rounded-md bg-slate-950 text-slate-100 p-4">
        <div className="text-sm font-medium mb-2">Update Log</div>
        <div ref={logsRef} className="h-32 overflow-y-auto font-mono text-xs space-y-1">
          {logs.length === 0 ? (
            <div className="text-slate-500 italic">No logs yet...</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className={log.includes("Error") ? "text-red-400" : log.includes("Complete") ? "text-green-400" : "text-slate-300"}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default BulkMetaUpdateSection;