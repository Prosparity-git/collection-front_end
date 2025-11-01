export type ContactType = 'applicant' | 'co_applicant';

export interface OTPRequest {
  loan_id: string;
  repayment_id: string;
  template_key: string; // "2"
  contact_type: ContactType;
  amount: number; // collected amount
}

export interface OTPVerificationRequest {
  loan_id: string;
  repayment_id: string;
  otp_code: string; // 4-digit
  contact_type: ContactType;
}

export interface OTPResendRequest {
  loan_id: number;
  repayment_id: number;
  contact_type: ContactType;
  retry_type: 'text' | 'voice';
}

export interface OTPResponse {
  success: boolean;
  message: string;
  data?: {
    otp_sent: boolean;
    expires_at?: string;
    attempts_remaining?: number;
  };
}

export interface OTPVerificationState {
  isLoading: boolean;
  otpSent: boolean;
  verificationAttempts: number;
  resendCooldown: number;        // seconds
  otpExpiryTime: number | null;  // timestamp ms
  selectedContactType: ContactType | null;
  errorMessage: string | null;
}

export const MAX_OTP_ATTEMPTS = 3;
export const OTP_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes
export const RESEND_COOLDOWN = 90 * 1000;     // 90 seconds


