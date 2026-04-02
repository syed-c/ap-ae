import { supabase } from "@/integrations/supabase/client";

interface GenerateSingleParams {
  page_type: "state" | "city";
  page_slug: string;
  location_name: string;
  emirate_slug: string;
  emirate_name: string;
  force_regenerate?: boolean;
}

interface GenerateBatchParams {
  page_type_filter?: "state" | "city" | "all";
  emirate_filter?: string;
  force_regenerate?: boolean;
  batch_size?: number;
  cursor?: string | null;
}

interface GenerateSingleResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
}

interface GenerateBatchResult {
  processed: number;
  skipped: number;
  failed: number;
  errors: string[];
  remaining?: number;
  total_count?: number;
  cursor?: string | null;
  has_more?: boolean;
  processed_count?: number;
}

export async function generateSingle(
  params: GenerateSingleParams
): Promise<GenerateSingleResult> {
  const { data, error } = await supabase.functions.invoke(
    "page-content-generator",
    {
      body: {
        action: "generate_single",
        ...params,
      },
    }
  );

  if (error) {
    return { success: false, error: error.message };
  }

  return data as GenerateSingleResult;
}

export async function generateBatch(
  params: GenerateBatchParams = {}
): Promise<GenerateBatchResult> {
  const { data, error } = await supabase.functions.invoke(
    "page-content-generator",
    {
      body: {
        action: "generate_batch",
        batch_limit: 3, // Always process 3 pages per call
        ...params,
      },
    }
  );

  if (error) {
    return {
      processed: 0,
      skipped: 0,
      failed: 0,
      errors: [error.message],
    };
  }

  return data as GenerateBatchResult;
}
