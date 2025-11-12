import { API_BASE_URL, getAuthHeaders } from '@/integrations/api/client';
import {
  OTPRequest,
  OTPVerificationRequest,
  OTPResendRequest,
  OTPResponse
} from '@/types/otp';

export class OTPService {
  static async sendOTP(request: OTPRequest): Promise<OTPResponse> {
    const response = await fetch(`${API_BASE_URL}/otp/send-otp-payment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const data = await response.json();
        message = data?.message || data?.detail || message;
      } catch {}
      throw new Error(message);
    }
    return (await response.json()) as OTPResponse;
  }

  static async verifyOTP(request: OTPVerificationRequest): Promise<OTPResponse> {
    const response = await fetch(`${API_BASE_URL}/otp/verify-otp-payment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const data = await response.json();
        message = data?.message || data?.detail || message;
      } catch {}
      throw new Error(message);
    }
    return (await response.json()) as OTPResponse;
  }

  static async resendOTP(request: OTPResendRequest): Promise<OTPResponse> {
    const response = await fetch(`${API_BASE_URL}/otp/resend-otp-payment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const data = await response.json();
        message = data?.message || data?.detail || message;
      } catch {}
      throw new Error(message);
    }
    return (await response.json()) as OTPResponse;
  }
}

export default OTPService;


