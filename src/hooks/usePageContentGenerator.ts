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

interface GenerateServicesResult extends GenerateBatchResult {
  page_type: "service";
}

interface GenerateServiceLocationsResult extends GenerateBatchResult {
  page_type: "service-location";
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
        batch_limit: 3,
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

export async function generateServices(
  params: { force_regenerate?: boolean; batch_limit?: number; cursor?: string | null } = {}
): Promise<GenerateServicesResult> {
  const { data, error } = await supabase.functions.invoke(
    "page-content-generator",
    {
      body: {
        action: "generate_services",
        batch_limit: 3,
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
      remaining: 0,
      total_count: 0,
      cursor: null,
      has_more: false,
      page_type: "service",
    };
  }

  return data as GenerateServicesResult;
}

export async function generateSingleService(
  serviceSlug: string,
  force_regenerate: boolean = false
): Promise<GenerateSingleResult> {
  const { data, error } = await supabase.functions.invoke(
    "page-content-generator",
    {
      body: {
        action: "generate_single_service",
        service_slug: serviceSlug,
        force_regenerate,
      },
    }
  );

  if (error) {
    return { success: false, error: error.message };
  }

  return data as GenerateSingleResult;
}

export async function generateServiceLocations(
  params: { force_regenerate?: boolean; batch_limit?: number; cursor?: string | null } = {}
): Promise<GenerateServiceLocationsResult> {
  const { data, error } = await supabase.functions.invoke(
    "page-content-generator",
    {
      body: {
        action: "generate_service_locations",
        batch_limit: 3,
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
      remaining: 0,
      total_count: 0,
      cursor: null,
      has_more: false,
      page_type: "service-location",
    };
  }

return data as GenerateServiceLocationsResult;
}

export async function generateServiceLocationsByCity(
  emirateSlug: string,
  citySlug: string,
  params: { force_regenerate?: boolean; batch_limit?: number; cursor?: string | null } = {}
): Promise<GenerateServiceLocationsResult> {
  const { data, error } = await supabase.functions.invoke(
    "page-content-generator",
    {
      body: {
        action: "generate_service_locations_by_city",
        emirate_slug: emirateSlug,
        city_slug: citySlug,
        batch_limit: params.batch_limit || 3,
        force_regenerate: params.force_regenerate || false,
        cursor: params.cursor || null,
      },
    }
  );

  if (error) {
    return {
      processed: 0,
      skipped: 0,
      failed: 0,
      errors: [error.message],
      remaining: 0,
      total_count: 0,
      cursor: null,
      has_more: false,
      page_type: "service-location",
    };
  }

  return data as GenerateServiceLocationsResult;
}

export async function generateSingleServiceLocation(
  slug: string,
  force_regenerate: boolean = false
): Promise<GenerateSingleResult> {
  const { data, error } = await supabase.functions.invoke(
    "page-content-generator",
    {
      body: {
        action: "generate_single_service_location",
        slug: slug,
        force_regenerate,
      },
    }
  );

  if (error) {
    return { success: false, error: error.message };
  }

  return data as GenerateSingleResult;
}
