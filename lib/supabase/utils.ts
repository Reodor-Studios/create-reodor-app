import { env } from "@/env";

export function getSupabaseAssetUrl(filename: string): string {
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets/${filename}`;
}

export function getLogoUrl(format: "svg" | "png" = "png"): string {
  const filename = format === "svg" ? "logo.svg" : "logo.png";
  return getSupabaseAssetUrl(filename);
}

/**
 * Fetches all rows from a Supabase query by automatically handling pagination.
 * Bypasses the default 1000 row limit by fetching data in batches.
 *
 * @param queryBuilder - A function that returns a Supabase query builder
 * @param batchSize - Number of rows to fetch per batch (default: 1000)
 * @returns Promise with all rows combined
 *
 * @example
 * ```typescript
 * // Fetch all addresses
 * const { data, error } = await fetchAllRows((offset, limit) =>
 *   supabase
 *     .from('addresses')
 *     .select('*')
 *     .range(offset, offset + limit - 1)
 * );
 *
 * // Fetch all addresses with user data
 * const { data, error } = await fetchAllRows((offset, limit) =>
 *   supabase
 *     .from('addresses')
 *     .select(`
 *       *,
 *       profiles!inner(role, first_name, last_name, email)
 *     `)
 *     .not('location', 'is', null)
 *     .range(offset, offset + limit - 1)
 * );
 * ```
 */
export async function fetchAllRows<T>(
  queryBuilder: (
    offset: number,
    limit: number,
  ) => Promise<{ data: T[] | null; error: unknown }>,
  batchSize: number = 1000,
): Promise<{ data: T[]; error: string | null }> {
  const allRows: T[] = [];
  let offset = 0;
  let hasMore = true;

  try {
    while (hasMore) {
      const { data, error } = await queryBuilder(offset, batchSize);

      if (error) {
        console.error("Error fetching batch:", error);
        return {
          data: [],
          error: error instanceof Error
            ? error.message
            : "Failed to fetch data",
        };
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      allRows.push(...(data as T[]));

      // If we got fewer rows than the batch size, we've reached the end
      if (data.length < batchSize) {
        hasMore = false;
      } else {
        offset += batchSize;
      }
    }

    return { data: allRows, error: null };
  } catch (error) {
    console.error("Error in fetchAllRows:", error);
    return {
      data: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
