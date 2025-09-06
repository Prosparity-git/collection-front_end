
import { processApplicationBatch, ProcessingResults } from './bulkOperations/applicationProcessor';

export const processBulkApplications = async (applications: any[], user?: any): Promise<ProcessingResults> => {
  return processApplicationBatch(applications, user);
};

export type { ProcessingResults };
