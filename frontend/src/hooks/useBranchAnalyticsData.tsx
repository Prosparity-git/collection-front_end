
import { useBranchPaymentData } from './useBranchPaymentData';
import { useBranchPTPData } from './useBranchPTPData';
import { Application } from '@/types/application';

export * from './useBranchPaymentData';
export * from './useBranchPTPData';

export const useBranchAnalyticsData = (applications: Application[], selectedEmiMonth?: string) => {
  const branchPaymentStatus = useBranchPaymentData(applications, selectedEmiMonth);
  const branchPtpStatus = useBranchPTPData(applications, selectedEmiMonth);

  return {
    branchPaymentStatusData: branchPaymentStatus.data,
    branchPaymentStatusLoading: branchPaymentStatus.loading,
    branchPaymentStatusError: branchPaymentStatus.error,
    branchPtpStatusData: branchPtpStatus.data,
    branchPtpStatusLoading: branchPtpStatus.loading,
    branchPtpStatusError: branchPtpStatus.error,
  };
};
