import { useState, useCallback, useRef } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { chunkArray } from '@/utils/batchUtils';

interface FieldStatusQuery {
  applicationIds: string[];
  selectedMonth?: string | null;
  includeAllMonths?: boolean;
}

interface FieldStatusCache {
  [key: string]: {
    data: Record<string, string>;
    timestamp: number;
    expiresAt: number;
  };
}

const CACHE_TTL = 10 * 1000; // Reduced to 10 seconds to prevent stale data
const BATCH_SIZE = 25; // Smaller batch size to reduce partial failures
const cache: FieldStatusCache = {};
const pendingRequests = new Map<string, Promise<Record<string, string>>>();
const requestQueue = new Map<string, { resolve: Function; reject: Function }[]>();

export const useFieldStatusManager = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getCacheKey = useCallback((queryParams: FieldStatusQuery): string => {
    // Simplified cache key generation to reduce complexity
    const sortedIds = [...queryParams.applicationIds].sort();
    const idsKey = sortedIds.length <= 5 ? sortedIds.join(',') : `${sortedIds.length}-${sortedIds[0]}-${sortedIds[sortedIds.length-1]}`;
    return `fs-${queryParams.selectedMonth || 'all'}-${idsKey}`;
  }, []);

  const isValidApplicationId = useCallback((id: any): id is string => {
    return typeof id === 'string' && id.trim().length > 0;
  }, []);

  const fetchFieldStatusChunk = useCallback(async (
    applicationIds: string[], 
    queryParams: FieldStatusQuery,
    retryCount = 0
  ): Promise<Record<string, string>> => {
    if (applicationIds.length === 0) return {};

    const maxRetries = 2;
    try {
      console.log(`📤 Fetching field status chunk: ${applicationIds.length} applications (attempt ${retryCount + 1})`);
      
      let clientQuery = client
        .from('field_status')
        .select('application_id, status, created_at, demand_date')
        .in('application_id', applicationIds);

      // Add month filtering if specified and not including all months
      if (queryParams.selectedMonth && !queryParams.includeAllMonths) {
        // Handle multiple month formats: "Jul-25", "2025-07", "2025-07-01", etc.
        let dbFormatMonth: string;
        
        console.log(`🔍 Processing month: "${queryParams.selectedMonth}"`);
        
        if (queryParams.selectedMonth.includes('-')) {
          const parts = queryParams.selectedMonth.split('-');
          
          // Check if it's already in YYYY-MM format (like "2025-07")
          if (parts.length >= 2 && parts[0].length === 4 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
            // Already in YYYY-MM format, use as is
            dbFormatMonth = `${parts[0]}-${parts[1].padStart(2, '0')}`;
            console.log(`✅ Already in YYYY-MM format: ${dbFormatMonth}`);
          } else {
            // Assume it's in Month-Year format (like "Jul-25")
            const [monthAbbr, year] = parts;
            const monthMap: Record<string, string> = {
              'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
              'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
              'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
            };
            const monthNum = monthMap[monthAbbr];
            
            // Fix year conversion - ensure proper string interpolation
            const fullYear = year.length === 2 ? `20${year}` : year;
            
            // Validate that we got valid month and year
            if (!monthNum || !fullYear) {
              console.error(`❌ Invalid month-year format: ${queryParams.selectedMonth}. MonthAbbr: ${monthAbbr}, Year: ${year}, MonthNum: ${monthNum}, FullYear: ${fullYear}`);
              throw new Error(`Invalid month-year format: ${queryParams.selectedMonth}`);
            }
            
            dbFormatMonth = `${fullYear}-${monthNum}`;
            console.log(`🔄 Month-Year conversion: ${queryParams.selectedMonth} → ${dbFormatMonth}`);
          }
        } else {
          dbFormatMonth = queryParams.selectedMonth;
        }
        
        // Validate the final date format
        const [year, month] = dbFormatMonth.split('-');
        if (!year || !month || isNaN(Number(year)) || isNaN(Number(month))) {
          console.error(`❌ Invalid database format month: ${dbFormatMonth}`);
          throw new Error(`Invalid database format month: ${dbFormatMonth}`);
        }
        
        const yearNum = Number(year);
        const monthNum = Number(month);
        const lastDay = new Date(yearNum, monthNum, 0).getDate();
        const monthStart = `${dbFormatMonth}-01`;
        const monthEnd = `${dbFormatMonth}-${String(lastDay).padStart(2, '0')}`;
        
        console.log(`📅 Field status month filter: ${monthStart} to ${monthEnd}`);
        clientQuery = clientQuery
          .gte('demand_date', monthStart)
          .lte('demand_date', monthEnd);
      }

      // Always order by created_at to get latest status per application
      clientQuery = clientQuery.order('created_at', { ascending: false });

      const { data, error } = await clientQuery;

      if (error) {
        throw new Error(`Field status query failed: ${error.message}`);
      }

      // Process data - get latest status per application
      const statusMap: Record<string, string> = {};
      const processedApps = new Set<string>();

      if (data) {
        data.forEach(record => {
          if (record && record.application_id && record.status) {
            const appId = record.application_id;
            if (!processedApps.has(appId)) {
              statusMap[appId] = record.status || 'Unpaid';
              processedApps.add(appId);
            }
          }
        });
      }

      // Validate data completeness
      const receivedCount = Object.keys(statusMap).length;
      const expectedCount = applicationIds.length;
      
      if (receivedCount < expectedCount * 0.8 && retryCount < maxRetries) {
        console.warn(`⚠️ Low data completeness: ${receivedCount}/${expectedCount}. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchFieldStatusChunk(applicationIds, queryParams, retryCount + 1);
      }

      console.log(`✅ Chunk processed: ${receivedCount}/${expectedCount} statuses loaded`);
      return statusMap;
    } catch (error) {
      if (retryCount < maxRetries) {
        console.warn(`⚠️ Chunk fetch failed, retrying (${retryCount + 1}/${maxRetries}):`, error);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchFieldStatusChunk(applicationIds, queryParams, retryCount + 1);
      }
      console.error('❌ Chunk fetch error after retries:', error);
      return {};
    }
  }, []);

  const fetchFieldStatus = useCallback(async (
    applicationIds: string[], 
    selectedMonth?: string | null,
    includeAllMonths = false
  ): Promise<Record<string, string>> => {
    if (!user || applicationIds.length === 0) {
      console.log('❌ No user or empty application IDs');
      return {};
    }

    // Validate and filter application IDs
    const validApplicationIds = applicationIds.filter(isValidApplicationId);
    if (validApplicationIds.length === 0) {
      console.warn('❌ No valid application IDs provided');
      return {};
    }

    console.log('=== FIELD STATUS MANAGER FETCH ===');
    console.log('Valid Application IDs:', validApplicationIds.length);
    console.log('Selected Month:', selectedMonth);

    const queryParams: FieldStatusQuery = {
      applicationIds: validApplicationIds,
      selectedMonth,
      includeAllMonths
    };

    const cacheKey = getCacheKey(queryParams);
    
    // Check cache first - stricter validation
    const cached = cache[cacheKey];
    if (cached && Date.now() < cached.expiresAt) {
      const cacheDataCount = Object.keys(cached.data).length;
      const expectedCount = validApplicationIds.length;
      
      // Only use cache if it has reasonable data completeness
      if (cacheDataCount >= expectedCount * 0.8) {
        console.log(`✅ Using cached field status data (${cacheDataCount}/${expectedCount})`);
        return cached.data;
      } else {
        console.warn(`⚠️ Cache data incomplete (${cacheDataCount}/${expectedCount}), refreshing`);
        delete cache[cacheKey];
      }
    }

    // Implement request deduplication with queue
    if (pendingRequests.has(cacheKey)) {
      console.log('⏳ Waiting for pending field status request');
      return new Promise((resolve, reject) => {
        if (!requestQueue.has(cacheKey)) {
          requestQueue.set(cacheKey, []);
        }
        requestQueue.get(cacheKey)!.push({ resolve, reject });
      });
    }

    // Create new request
    const requestPromise = (async (): Promise<Record<string, string>> => {
      try {
        setLoading(true);
        console.log(`🚀 Starting fresh field status fetch for ${validApplicationIds.length} applications`);

        // Chunk the application IDs with smaller batches
        const chunks = chunkArray(validApplicationIds, BATCH_SIZE);
        console.log(`📦 Splitting into ${chunks.length} chunks of max ${BATCH_SIZE} IDs each`);

        // Process chunks sequentially to reduce load and improve consistency
        const combinedStatusMap: Record<string, string> = {};
        let successfulChunks = 0;

        for (let i = 0; i < chunks.length; i++) {
          try {
            const chunkResult = await fetchFieldStatusChunk(chunks[i], queryParams);
            Object.assign(combinedStatusMap, chunkResult);
            successfulChunks++;
            
            // Small delay between chunks to prevent overwhelming the database
            if (i < chunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (error) {
            console.error(`❌ Chunk ${i + 1} failed:`, error);
          }
        }

        // Ensure every applicationId has a status; default to 'Unpaid' if missing
        validApplicationIds.forEach(appId => {
          if (!combinedStatusMap[appId]) {
            combinedStatusMap[appId] = 'Unpaid';
          }
        });

        const resultCount = Object.keys(combinedStatusMap).length;
        console.log(`✅ Field status loaded: ${resultCount} applications (${successfulChunks}/${chunks.length} chunks successful)`);

        // Only cache if we have reasonable data completeness
        if (resultCount >= validApplicationIds.length * 0.8) {
          cache[cacheKey] = {
            data: combinedStatusMap,
            timestamp: Date.now(),
            expiresAt: Date.now() + CACHE_TTL
          };
          console.log(`💾 Cached field status data (${resultCount} applications)`);
        } else {
          console.warn(`⚠️ Not caching incomplete data (${resultCount}/${validApplicationIds.length})`);
        }

        // Resolve any queued requests
        const queuedRequests = requestQueue.get(cacheKey) || [];
        queuedRequests.forEach(({ resolve }) => resolve(combinedStatusMap));
        requestQueue.delete(cacheKey);

        return combinedStatusMap;
      } catch (error) {
        console.error('❌ Error in fetchFieldStatus:', error);
        
        // Reject any queued requests
        const queuedRequests = requestQueue.get(cacheKey) || [];
        queuedRequests.forEach(({ reject }) => reject(error));
        requestQueue.delete(cacheKey);
        
        return {};
      } finally {
        setLoading(false);
      }
    })();

    // Store pending request
    pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }, [user, isValidApplicationId, getCacheKey, fetchFieldStatusChunk]);

  const clearCache = useCallback(() => {
    Object.keys(cache).forEach(key => delete cache[key]);
    pendingRequests.clear();
    requestQueue.clear();
    console.log('🧹 Field status cache, pending requests, and queue cleared');
  }, []);

  return {
    fetchFieldStatus,
    loading,
    clearCache
  };
};