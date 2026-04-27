import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateSingle, generateBatch, generateServices, generateServiceLocations, generateServiceLocationsByEmirate, generateServiceLocationsByCity, generateSingleService, generateSingleServiceLocation } from "@/hooks/usePageContentGenerator";
import BulkMetaUpdateSection from "./BulkMetaUpdateSection";
import { FileText, Play, Square, Loader2, Check, X, AlertCircle, Layers, RefreshCw, Settings } from "lucide-react";
import { toast } from "sonner";

interface State {
  id: string;
  name: string;
  slug: string;
}

interface City {
  id: string;
  name: string;
  slug: string;
  state_id: string;
}

export default function PageContentGeneratorTab() {
  const queryClient = useQueryClient();
  const logsScrollRef = useRef<HTMLDivElement>(null);

  // Single page form state
  const [singleForm, setSingleForm] = useState({
    page_type: "state" as "state" | "city",
    page_slug: "",
    location_name: "",
    emirate_slug: "",
    emirate_name: "",
    force_regenerate: false,
  });
  const [isGeneratingSingle, setIsGeneratingSingle] = useState(false);

  // Batch form state
  const [batchForm, setBatchForm] = useState({
    page_type_filter: "all" as "state" | "city" | "all",
    emirate_filter: "",
    batch_size: 10,
    force_regenerate: false,
  });
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const stopRef = useRef(false);
  const [batchLogs, setBatchLogs] = useState<string[]>([]);

  // Service generation state
  const [serviceForm, setServiceForm] = useState({
    batch_size: 5,
    force_regenerate: false,
  });
  const [isServiceRunning, setIsServiceRunning] = useState(false);
  const [serviceLogs, setServiceLogs] = useState<string[]>([]);

  // Service-location generation state
  const [slForm, setSlForm] = useState({
    batch_size: 3,
    force_regenerate: false,
  });
  const [isSlRunning, setIsSlRunning] = useState(false);
  const [slLogs, setSlLogs] = useState<string[]>([]);

  // Single service generation state
  const [singleServiceForm, setSingleServiceForm] = useState({
    service_slug: "",
    force_regenerate: false,
  });
  const [isSingleServiceGenerating, setIsSingleServiceGenerating] = useState(false);

  // Service-location by emirate state
  const [slEmirateForm, setSlEmirateForm] = useState({
    emirate_slug: "",
    batch_size: 5,
    force_regenerate: false,
  });
  const [isSlEmirateRunning, setIsSlEmirateRunning] = useState(false);

  // Service-location by city state
  const [slCityForm, setSlCityForm] = useState({
    emirate_slug: "",
    city_slug: "",
    batch_size: 5,
    force_regenerate: false,
  });
  const [isSlCityRunning, setIsSlCityRunning] = useState(false);

  // Single service-location state
  const [singleSlForm, setSingleSlForm] = useState({
    slug: "",
    force_regenerate: false,
  });
  const [isSingleSlGenerating, setIsSingleSlGenerating] = useState(false);

  // Auto-scroll logs
  useEffect(() => {
    if (logsScrollRef.current) {
      logsScrollRef.current.scrollTop = logsScrollRef.current.scrollHeight;
    }
  }, [batchLogs]);

  // Fetch states for dropdown
  const { data: states } = useQuery({
    queryKey: ["page-content-generator-states"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("states")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as State[];
    },
  });

  // Fetch cities for dropdown (filtered by emirate)
  const { data: cities } = useQuery({
    queryKey: ["page-content-generator-cities", slCityForm.emirate_slug],
    queryFn: async () => {
      if (!slCityForm.emirate_slug) return [];
      const state = states?.find(s => s.slug === slCityForm.emirate_slug);
      if (!state) return [];
      const { data, error } = await supabase
        .from("cities")
        .select("id, name, slug, state_id")
        .eq("state_id", state.id)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as City[];
    },
    enabled: !!slCityForm.emirate_slug && !!states,
  });

  const handleSingleGenerate = async () => {
    if (!singleForm.page_slug || !singleForm.location_name || !singleForm.emirate_slug || !singleForm.emirate_name) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsGeneratingSingle(true);
    try {
      const result = await generateSingle({
        page_type: singleForm.page_type,
        page_slug: singleForm.page_slug,
        location_name: singleForm.location_name,
        emirate_slug: singleForm.emirate_slug,
        emirate_name: singleForm.emirate_name,
        force_regenerate: singleForm.force_regenerate,
      });

      if (result.success) {
        if (result.skipped) {
          toast.info(`Content already exists for ${singleForm.page_slug} (skipped)`);
        } else {
          toast.success(`Content generated for ${singleForm.page_slug}`);
        }
      } else {
        toast.error(result.error || "Failed to generate content");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsGeneratingSingle(false);
    }
  };

  const handleBatchRun = async () => {
    setIsBatchRunning(true);
    setBatchLogs([]);
    stopRef.current = false;

    try {
      setBatchLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Starting batch generation...`]);

      let totalProcessed = 0;
      let totalSkipped = 0;
      let totalFailed = 0;
      let allErrors: string[] = [];
      let loopCount = 0;
      const MAX_LOOPS = 50; // Safety limit - can handle up to 50*3=150 pages
      let cursor: string | null = null;

      while (!stopRef.current && loopCount < MAX_LOOPS) {
        loopCount++;
        
        const result = await generateBatch({
          page_type_filter: batchForm.page_type_filter,
          emirate_filter: batchForm.emirate_filter || undefined,
          batch_size: batchForm.batch_size,
          force_regenerate: batchForm.force_regenerate,
          cursor: cursor,
        });

        totalProcessed += result.processed;
        totalSkipped += result.skipped;
        totalFailed += result.failed;
        allErrors = [...allErrors, ...result.errors];

        setBatchLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Batch ${loopCount}: ${result.processed} processed, ${result.skipped} skipped, ${result.failed} failed`
        ]);

        if (result.errors.length > 0) {
          result.errors.forEach((err) => {
            setBatchLogs((prev) => [...prev, `[ERROR] ${err}`]);
          });
        }

        // Only stop when no more pages to process
        if (!result.has_more) {
          setBatchLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] All pages completed!`]);
          break;
        }

        // Update cursor for next batch
        cursor = result.cursor;
        const remaining = result.remaining || 0;
        
        // If no pages were processed in this batch but there are more, there was an error
        if (result.processed === 0 && remaining > 0) {
          setBatchLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Warning: No pages processed but ${remaining} remaining. Stopping to prevent infinite loop.`]);
          break;
        }
        
        setBatchLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${remaining} pages remaining, fetching next batch...`]);
      }

      setBatchLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Total: ${totalProcessed} processed, ${totalSkipped} skipped, ${totalFailed} failed`
      ]);

    } catch (err) {
      setBatchLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${err instanceof Error ? err.message : "Unknown error"}`]);
    } finally {
      setIsBatchRunning(false);
    }
  };

  const handleStopBatch = () => {
    stopRef.current = true;
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Page Content Generator</h1>
          <p className="text-muted-foreground">Generate SEO content for state and city pages</p>
        </div>
      </div>

      {/* Section 1: Single Page Generation */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Generate Single Page</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Page Type</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={singleForm.page_type}
              onChange={(e) => setSingleForm({ ...singleForm, page_type: e.target.value as "state" | "city" })}
            >
              <option value="state">State (Emirate)</option>
              <option value="city">City (Area)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Page Slug *</label>
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2"
              placeholder={singleForm.page_type === "state" ? "/dubai" : "/dubai/al-barsha"}
              value={singleForm.page_slug}
              onChange={(e) => setSingleForm({ ...singleForm, page_slug: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location Name *</label>
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2"
              placeholder={singleForm.page_type === "state" ? "Dubai" : "Al Barsha"}
              value={singleForm.location_name}
              onChange={(e) => setSingleForm({ ...singleForm, location_name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Emirate Slug *</label>
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2"
              placeholder="dubai"
              value={singleForm.emirate_slug}
              onChange={(e) => setSingleForm({ ...singleForm, emirate_slug: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Emirate Name *</label>
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2"
              placeholder="Dubai"
              value={singleForm.emirate_name}
              onChange={(e) => setSingleForm({ ...singleForm, emirate_name: e.target.value })}
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={singleForm.force_regenerate}
                onChange={(e) => setSingleForm({ ...singleForm, force_regenerate: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Force Regenerate</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleSingleGenerate}
          disabled={isGeneratingSingle}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingSingle ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Generate Page
            </>
          )}
        </button>
      </div>

      {/* Section 2: Batch Generator */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Batch Generator</h2>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Page Type Filter</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={batchForm.page_type_filter}
              onChange={(e) => setBatchForm({ ...batchForm, page_type_filter: e.target.value as "state" | "city" | "all" })}
            >
              <option value="all">All</option>
              <option value="state">State Only</option>
              <option value="city">City Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Emirate Filter</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={batchForm.emirate_filter}
              onChange={(e) => setBatchForm({ ...batchForm, emirate_filter: e.target.value })}
            >
              <option value="">All Emirates</option>
              {states?.map((state) => (
                <option key={state.id} value={state.slug}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Batch Size</label>
            <input
              type="number"
              min={1}
              max={50}
              className="w-full border rounded-md px-3 py-2"
              value={batchForm.batch_size}
              onChange={(e) => setBatchForm({ ...batchForm, batch_size: Math.min(50, Math.max(1, parseInt(e.target.value) || 10)) })}
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={batchForm.force_regenerate}
                onChange={(e) => setBatchForm({ ...batchForm, force_regenerate: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Force Regenerate</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isBatchRunning ? (
            <button
              onClick={handleBatchRun}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              <Play className="w-4 h-4" />
              Run Batch Generation
            </button>
          ) : (
            <button
              onClick={handleStopBatch}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          )}

          {isBatchRunning && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </div>
          )}
        </div>

        {/* Log Panel */}
        <div className="border rounded-md bg-slate-950 text-slate-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress Log</span>
            {batchLogs.length > 0 && (
              <span className="text-xs text-slate-400">
                {batchLogs.filter((l) => l.includes("complete")).length > 0
                  ? "Done"
                  : `${batchLogs.length} entries`}
              </span>
            )}
          </div>
          <div
            ref={logsScrollRef}
            className="h-64 overflow-y-auto font-mono text-xs space-y-1"
          >
            {batchLogs.length === 0 ? (
              <div className="text-slate-500 italic">No logs yet...</div>
            ) : (
              batchLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={
                    log.includes("[ERROR]") || log.includes("Error:")
                      ? "text-red-400"
                      : log.includes("complete")
                      ? "text-green-400"
                      : log.includes("skipped")
                      ? "text-yellow-400"
                      : "text-slate-300"
                  }
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Service Pages Generator */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Generate Service Pages</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate SEO content for service pages (e.g., /services/invisalign, /services/veneers)
        </p>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Batch Size</label>
            <input
              type="number"
              min={1}
              max={20}
              className="w-full border rounded-md px-3 py-2"
              value={serviceForm.batch_size}
              onChange={(e) => setServiceForm({ ...serviceForm, batch_size: Math.min(20, Math.max(1, parseInt(e.target.value) || 5)) })}
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={serviceForm.force_regenerate}
                onChange={(e) => setServiceForm({ ...serviceForm, force_regenerate: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Force Regenerate</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isServiceRunning ? (
            <button
              onClick={async () => {
                setIsServiceRunning(true);
                setServiceLogs([]);
                let totalProcessed = 0;
                let totalFailed = 0;
                let cursor: string | null = null;

                try {
                  setServiceLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Starting service pages generation...`]);

                  while (true) {
                    const result = await generateServices({
                      batch_limit: serviceForm.batch_size,
                      force_regenerate: serviceForm.force_regenerate,
                      cursor,
                    });

                    totalProcessed += result.processed;
                    totalFailed += result.failed;

                    setServiceLogs((prev) => [
                      ...prev,
                      `[${new Date().toLocaleTimeString()}] Batch: ${result.processed} processed, ${result.failed} failed, ${result.remaining} remaining`
                    ]);

                    if (!result.has_more) {
                      setServiceLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Done! Total: ${totalProcessed} processed, ${totalFailed} failed`]);
                      break;
                    }
                    if (result.failed > 0 && result.remaining > 0) break;
                    cursor = result.cursor;
                    if (result.processed === 0) break;
                  }
                } catch (err) {
                  setServiceLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${err}`]);
                } finally {
                  setIsServiceRunning(false);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              <Play className="w-4 h-4" />
              Generate Service Pages
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </div>
          )}
        </div>

        <div className="border rounded-md bg-slate-950 text-slate-100 p-4">
          <div className="text-sm font-medium mb-2">Service Pages Log</div>
          <div className="h-32 overflow-y-auto font-mono text-xs space-y-1">
            {serviceLogs.length === 0 ? (
              <div className="text-slate-500 italic">No logs yet...</div>
            ) : (
              serviceLogs.map((log, idx) => (
                <div key={idx} className={log.includes("Error") ? "text-red-400" : log.includes("Done") ? "text-green-400" : "text-slate-300"}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 3b: Single Service Generation */}
        <div className="bg-white rounded-lg border p-6 space-y-4 mt-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Generate Single Service Page</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Generate content for a specific service (e.g., general-dentistry, invisalign, dental-implants)
          </p>

          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Enter service slug (e.g., general-dentistry)"
                className="w-full border rounded-md px-3 py-2"
                onChange={(e) => setSingleServiceForm({ ...singleServiceForm, service_slug: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={singleServiceForm.force_regenerate}
                onChange={(e) => setSingleServiceForm({ ...singleServiceForm, force_regenerate: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Force</span>
            </label>
            <button
              onClick={async () => {
                if (!singleServiceForm.service_slug) {
                  toast.error("Please enter a service slug");
                  return;
                }
                setIsSingleServiceGenerating(true);
                try {
                  const result = await generateSingleService(singleServiceForm.service_slug, singleServiceForm.force_regenerate);
                  if (result.success) {
                    toast.success(`Generated: ${singleServiceForm.service_slug}`);
                  } else {
                    toast.error(result.error || "Generation failed");
                  }
                } catch (err) {
                  toast.error("Error: " + err);
                } finally {
                  setIsSingleServiceGenerating(false);
                }
              }}
              disabled={isSingleServiceGenerating || !singleServiceForm.service_slug}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isSingleServiceGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Generate
            </button>
          </div>
        </div>

      </div>

      {/* Section 4: Service-Location Pages Generator */}
      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Generate Service-Location Pages</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate SEO content for city + service pages (e.g., /dubai/mirdif/invisalign, /abu-dhabi/al-ain/veneers)
        </p>

        {/* 4a: Generate by Emirate - All Areas */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Generate by Emirate (All Areas)</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Generate content for all service-location pages in a specific emirate (e.g., all Dubai areas + all services)
          </p>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[200px]">
              <label className="block text-sm font-medium mb-1">Select Emirate</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={slEmirateForm.emirate_slug}
                onChange={(e) => setSlEmirateForm({ ...slEmirateForm, emirate_slug: e.target.value })}
              >
                <option value="">Select Emirate...</option>
                {states?.map((state) => (
                  <option key={state.id} value={state.slug}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium mb-1">Batch</label>
              <input
                type="number"
                min={1}
                max={20}
                className="w-full border rounded-md px-3 py-2"
                value={slEmirateForm.batch_size}
                onChange={(e) => setSlEmirateForm({ ...slEmirateForm, batch_size: Math.min(20, Math.max(1, parseInt(e.target.value) || 5)) })}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={slEmirateForm.force_regenerate}
                onChange={(e) => setSlEmirateForm({ ...slEmirateForm, force_regenerate: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Force</span>
            </label>
            <button
              onClick={async () => {
                if (!slEmirateForm.emirate_slug) {
                  toast.error("Please select an emirate");
                  return;
                }
                setIsSlEmirateRunning(true);
                setSlLogs([]);
                let totalProcessed = 0;
                let totalSkipped = 0;
                let totalFailed = 0;
                try {
                  setSlLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Starting generation for emirate: ${slEmirateForm.emirate_slug}...`]);
                  let cursor: string | null = null;
                  while (true) {
                    const result = await generateServiceLocationsByEmirate(
                      slEmirateForm.emirate_slug,
                      { batch_limit: slEmirateForm.batch_size, force_regenerate: slEmirateForm.force_regenerate, cursor }
                    );
                    totalProcessed += result.processed;
                    totalSkipped += result.skipped;
                    totalFailed += result.failed;
                    setSlLogs((prev) => [
                      ...prev,
                      `[${new Date().toLocaleTimeString()}] Batch: ${result.processed} processed, ${result.skipped} skipped, ${result.failed} failed, ${result.remaining || 0} remaining`
                    ]);
                    if (!result.has_more) {
                      setSlLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Done! Total: ${totalProcessed} processed, ${totalSkipped} skipped, ${totalFailed} failed`]);
                      break;
                    }
                    if (result.processed === 0 && result.remaining > 0) break;
                    cursor = result.cursor;
                  }
                } catch (err) {
                  setSlLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${err}`]);
                } finally {
                  setIsSlEmirateRunning(false);
                }
              }}
              disabled={isSlEmirateRunning || !slEmirateForm.emirate_slug}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {isSlEmirateRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Generate All Areas in Emirate
            </button>
          </div>
        </div>

        {/* 4b: Generate by City - All Services */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Generate by City/Area (All Services)</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Generate content for all service pages in a specific area (e.g., all services in Al Barsha, Dubai)
          </p>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium mb-1">Emirate</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={slCityForm.emirate_slug}
                onChange={(e) => setSlCityForm({ ...slCityForm, emirate_slug: e.target.value, city_slug: "" })}
              >
                <option value="">Select Emirate...</option>
                {states?.map((state) => (
                  <option key={state.id} value={state.slug}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[200px]">
              <label className="block text-sm font-medium mb-1">Area/City</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={slCityForm.city_slug}
                onChange={(e) => setSlCityForm({ ...slCityForm, city_slug: e.target.value })}
                disabled={!slCityForm.emirate_slug}
              >
                <option value="">Select Area...</option>
                {cities?.map((city) => (
                  <option key={city.id} value={city.slug}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium mb-1">Batch</label>
              <input
                type="number"
                min={1}
                max={20}
                className="w-full border rounded-md px-3 py-2"
                value={slCityForm.batch_size}
                onChange={(e) => setSlCityForm({ ...slCityForm, batch_size: Math.min(20, Math.max(1, parseInt(e.target.value) || 5)) })}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={slCityForm.force_regenerate}
                onChange={(e) => setSlCityForm({ ...slCityForm, force_regenerate: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Force</span>
            </label>
            <button
              onClick={async () => {
                if (!slCityForm.emirate_slug || !slCityForm.city_slug) {
                  toast.error("Please select emirate and area");
                  return;
                }
                setIsSlCityRunning(true);
                setSlLogs([]);
                let totalProcessed = 0;
                let totalSkipped = 0;
                let totalFailed = 0;
                let cursor: string | null = null;
                try {
                  setSlLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Starting generation for ${slCityForm.city_slug}, ${slCityForm.emirate_slug}...`]);
                  while (true) {
                    const result = await generateServiceLocationsByCity(
                      slCityForm.emirate_slug,
                      slCityForm.city_slug,
                      { batch_limit: slCityForm.batch_size, force_regenerate: slCityForm.force_regenerate, cursor }
                    );
                    totalProcessed += result.processed;
                    totalSkipped += result.skipped;
                    totalFailed += result.failed;
                    setSlLogs((prev) => [
                      ...prev,
                      `[${new Date().toLocaleTimeString()}] Batch: ${result.processed} processed, ${result.skipped} skipped, ${result.failed} failed, ${result.remaining || 0} remaining`
                    ]);
                    if (!result.has_more) {
                      setSlLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Done! Total: ${totalProcessed} processed, ${totalSkipped} skipped, ${totalFailed} failed`]);
                      break;
                    }
                    if (result.processed === 0 && result.remaining > 0) break;
                    cursor = result.cursor;
                  }
                } catch (err) {
                  setSlLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${err}`]);
                } finally {
                  setIsSlCityRunning(false);
                }
              }}
              disabled={isSlCityRunning || !slCityForm.emirate_slug || !slCityForm.city_slug}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {isSlCityRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Generate All Services in Area
            </button>
          </div>
        </div>

        {/* 4c: Generate Single Service-Location Page */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <h3 className="font-semibold">Generate Single Service-Location Page</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Generate content for a specific service-location page (e.g., /dubai/al-barsha/general-dentistry)
          </p>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[300px]">
              <input
                type="text"
                placeholder="Enter slug (e.g., dubai/al-barsha/general-dentistry)"
                className="w-full border rounded-md px-3 py-2"
                value={singleSlForm.slug}
                onChange={(e) => setSingleSlForm({ ...singleSlForm, slug: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={singleSlForm.force_regenerate}
                onChange={(e) => setSingleSlForm({ ...singleSlForm, force_regenerate: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Force</span>
            </label>
            <button
              onClick={async () => {
                if (!singleSlForm.slug) {
                  toast.error("Please enter a slug");
                  return;
                }
                setIsSingleSlGenerating(true);
                try {
                  const result = await generateSingleServiceLocation(singleSlForm.slug, singleSlForm.force_regenerate);
                  if (result.success) {
                    if (result.skipped) {
                      toast.info(`Content already exists for /${singleSlForm.slug} (skipped)`);
                    } else {
                      toast.success(`Generated: /${singleSlForm.slug}`);
                    }
                  } else {
                    toast.error(result.error || "Generation failed");
                  }
                } catch (err) {
                  toast.error("Error: " + err);
                } finally {
                  setIsSingleSlGenerating(false);
                }
              }}
              disabled={isSingleSlGenerating || !singleSlForm.slug}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isSingleSlGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Generate
            </button>
          </div>
        </div>

        {/* 4d: Generate All Service-Location Pages (existing) */}
        <div className="border rounded-lg p-4 space-y-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <h3 className="font-semibold">Generate All Service-Location Pages</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Generate content for ALL service-location pages across all emirates and cities (use with caution)
          </p>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-24">
              <label className="block text-sm font-medium mb-1">Batch</label>
              <input
                type="number"
                min={1}
                max={10}
                className="w-full border rounded-md px-3 py-2"
                value={slForm.batch_size}
                onChange={(e) => setSlForm({ ...slForm, batch_size: Math.min(10, Math.max(1, parseInt(e.target.value) || 3)) })}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={slForm.force_regenerate}
                onChange={(e) => setSlForm({ ...slForm, force_regenerate: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Force</span>
            </label>
            <button
              onClick={async () => {
                setIsSlRunning(true);
                setSlLogs([]);
                let totalProcessed = 0;
                let totalFailed = 0;
                let cursor: string | null = null;
                try {
                  setSlLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Starting service-location pages generation...`]);
                  while (true) {
                    const result = await generateServiceLocations({
                      batch_limit: slForm.batch_size,
                      force_regenerate: slForm.force_regenerate,
                      cursor,
                    });
                    totalProcessed += result.processed;
                    totalFailed += result.failed;
                    setSlLogs((prev) => [
                      ...prev,
                      `[${new Date().toLocaleTimeString()}] Batch: ${result.processed} processed, ${result.failed} failed, ${result.remaining} remaining`
                    ]);
                    if (!result.has_more) {
                      setSlLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Done! Total: ${totalProcessed} processed, ${totalFailed} failed`]);
                      break;
                    }
                    cursor = result.cursor;
                    if (result.processed === 0) break;
                  }
                } catch (err) {
                  setSlLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${err}`]);
                } finally {
                  setIsSlRunning(false);
                }
              }}
              disabled={isSlRunning}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isSlRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Generate All (Careful!)
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="border rounded-md bg-slate-950 text-slate-100 p-4">
          <div className="text-sm font-medium mb-2">Service-Location Pages Log</div>
          <div className="h-32 overflow-y-auto font-mono text-xs space-y-1">
            {slLogs.length === 0 ? (
              <div className="text-slate-500 italic">No logs yet...</div>
            ) : (
              slLogs.map((log, idx) => (
                <div key={idx} className={log.includes("Error") ? "text-red-400" : log.includes("Done") ? "text-green-400" : "text-slate-300"}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Section 5: Bulk Meta Update */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Bulk Meta Title & Description Update
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Update meta titles and descriptions for all page types in bulk using smart templates
            </p>
          </div>
        </div>

        <BulkMetaUpdateSection />
      </div>
    </div>
  );
}
