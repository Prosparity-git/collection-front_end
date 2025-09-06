
// Utility functions for batched operations

export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// Reduced batch size to prevent URL length issues
export const BATCH_SIZE = 50; // Even safer batch size

// Calculate estimated URL length for a batch
export const estimateUrlLength = (baseUrl: string, applicationIds: string[]): number => {
  const idsParam = applicationIds.join(',');
  return baseUrl.length + idsParam.length + 100; // Extra buffer for other params
};

// Get optimal batch size based on URL length constraints
export const getOptimalBatchSize = (applicationIds: string[], maxUrlLength: number = 1500): number => {
  if (applicationIds.length === 0) return BATCH_SIZE;
  
  const avgIdLength = applicationIds.reduce((sum, id) => sum + id.length, 0) / applicationIds.length;
  const baseUrlLength = 200; // Estimated base URL + params length
  const maxIdsLength = maxUrlLength - baseUrlLength;
  const estimatedBatchSize = Math.floor(maxIdsLength / (avgIdLength + 3)); // +3 for commas and encoding
  
  return Math.min(Math.max(estimatedBatchSize, 10), BATCH_SIZE); // Between 10 and BATCH_SIZE
};

// Validate request size before sending
export const isRequestSizeSafe = (url: string, maxLength: number = 1500): boolean => {
  return url.length <= maxLength;
};
