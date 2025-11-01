import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { OTPService } from '@/integrations/api/services/otpService';
import { ContactType, MAX_OTP_ATTEMPTS, OTP_EXPIRY_TIME, RESEND_COOLDOWN } from '@/types/otp';
import { Application } from '@/types/application';
import { ContactsService, ApplicationContactsResponse } from '@/integrations/api/services/contactsService';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  application: Application;
  amount: number;
};

// Show full number as requested

function mmss(msRemaining: number): string {
  const totalSec = Math.max(0, Math.floor(msRemaining / 1000));
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function OTPVerificationModal({ open, onClose, onSuccess, application, amount }: Props) {
  const [selectedContactType, setSelectedContactType] = useState<ContactType | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [resendCooldownMs, setResendCooldownMs] = useState(0);
  const [expiryAtMs, setExpiryAtMs] = useState<number | null>(null);
  const [contacts, setContacts] = useState<ApplicationContactsResponse | null>(null);
  const [contactsLoading, setContactsLoading] = useState(false);

  const cooldownTimerRef = useRef<number | null>(null);
  const expiryTimerRef = useRef<number | null>(null);

  const loanId = String(application?.loan_id ?? '');
  const repaymentId = String((application as any)?.payment_id ?? '');

  // Fetch contacts when modal opens
  useEffect(() => {
    if (open && loanId) {
      setContactsLoading(true);
      ContactsService.getApplicationContacts(loanId)
        .then((data) => {
          setContacts(data);
        })
        .catch((error) => {
          console.error('Failed to fetch contacts:', error);
          toast.error('Failed to load contacts');
        })
        .finally(() => {
          setContactsLoading(false);
        });
    }
  }, [open, loanId]);

  const contactMobile = useMemo(() => {
    if (!contacts) return '';
    
    switch (selectedContactType) {
      case 'applicant':
        return contacts.applicant?.phone || '';
      case 'co_applicant':
        // For co-applicant, use the first co-applicant's phone number
        return contacts.co_applicants?.[0]?.phone || '';
      default:
        return '';
    }
  }, [selectedContactType, contacts]);

  // Show complete number instead of masked

  // Cleanup timers on unmount/close
  useEffect(() => {
    if (!open) {
      if (cooldownTimerRef.current) window.clearInterval(cooldownTimerRef.current);
      if (expiryTimerRef.current) window.clearInterval(expiryTimerRef.current);
      cooldownTimerRef.current = null;
      expiryTimerRef.current = null;
      setOtpCode('');
      setOtpSent(false);
      setErrorMessage(null);
      setVerificationAttempts(0);
      setResendCooldownMs(0);
      setExpiryAtMs(null);
      setSelectedContactType(null);
      setContacts(null);
    }
  }, [open]);

  useEffect(() => {
    if (resendCooldownMs <= 0 && cooldownTimerRef.current) {
      window.clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  }, [resendCooldownMs]);

  useEffect(() => {
    if (expiryAtMs && Date.now() >= expiryAtMs) {
      setErrorMessage('OTP expired. Please resend.');
    }
  }, [expiryAtMs]);

  const startCooldown = () => {
    setResendCooldownMs(RESEND_COOLDOWN);
    if (cooldownTimerRef.current) window.clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = window.setInterval(() => {
      setResendCooldownMs(prev => Math.max(0, prev - 1000));
    }, 1000);
  };

  const startExpiry = () => {
    const expiry = Date.now() + OTP_EXPIRY_TIME;
    setExpiryAtMs(expiry);
    if (expiryTimerRef.current) window.clearInterval(expiryTimerRef.current);
    expiryTimerRef.current = window.setInterval(() => {
      if (Date.now() >= expiry) {
        window.clearInterval(expiryTimerRef.current!);
        expiryTimerRef.current = null;
        setErrorMessage('OTP expired. Please resend.');
      } else {
        // trigger re-render by updating state to same value
        setExpiryAtMs(expiry);
      }
    }, 1000);
  };

  const handleSend = async () => {
    try {
      setErrorMessage(null);
      if (!selectedContactType) {
        toast.error('Select a contact');
        return;
      }
      if (!loanId || !repaymentId) {
        toast.error('Missing identifiers.');
        return;
      }
      if (!contactMobile) {
        toast.error('Selected contact has no mobile number');
        return;
      }
      setIsLoading(true);
      await OTPService.sendOTP({
        loan_id: loanId,
        repayment_id: repaymentId,
        template_key: '2',
        contact_type: selectedContactType,
        amount: Number(amount) || 0
      });
      setOtpSent(true);
      startCooldown();
      startExpiry();
      toast.success('OTP sent successfully');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to send OTP';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setErrorMessage(null);
      if (!selectedContactType) {
        toast.error('Select a contact');
        return;
      }
      if (!otpSent) {
        toast.error('Send OTP first');
        return;
      }
      if (verificationAttempts >= MAX_OTP_ATTEMPTS) {
        setErrorMessage('Maximum attempts exceeded. Please try later.');
        return;
      }
      if (!/^\d{4}$/.test(otpCode)) {
        setErrorMessage('Enter a valid 4-digit OTP');
        return;
      }
      if (expiryAtMs && Date.now() >= expiryAtMs) {
        setErrorMessage('OTP expired. Please resend.');
        return;
      }

      setIsLoading(true);
      await OTPService.verifyOTP({
        loan_id: loanId,
        repayment_id: repaymentId,
        otp_code: otpCode,
        contact_type: selectedContactType
      });
      toast.success('OTP verified');
      await onSuccess();
      onClose();
    } catch (e) {
      setVerificationAttempts(prev => prev + 1);
      const msg = e instanceof Error ? e.message : 'Verification failed';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setErrorMessage(null);
      if (!selectedContactType) {
        toast.error('Select a contact');
        return;
      }
      if (!loanId || !repaymentId) {
        toast.error('Missing identifiers.');
        return;
      }
      if (resendCooldownMs > 0) return;
      setIsLoading(true);
      await OTPService.resendOTP({
        loan_id: Number(loanId),
        repayment_id: Number(repaymentId),
        contact_type: selectedContactType,
        retry_type: 'text'
      });
      setOtpSent(true);
      startCooldown();
      startExpiry();
      toast.success('OTP resent');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to resend OTP';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const expiresInMs = expiryAtMs ? Math.max(0, expiryAtMs - Date.now()) : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => (!v && !otpSent ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-md" hideClose={otpSent}>
        <DialogHeader>
          <DialogTitle>Payment Verification</DialogTitle>
          <DialogDescription>
            Verify payment for {application?.applicant_name ?? 'applicant'} using OTP
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Contact</Label>
            {contactsLoading ? (
              <div className="text-sm text-muted-foreground">Loading contacts...</div>
            ) : (
              <RadioGroup
                value={selectedContactType ?? ''}
                onValueChange={(v) => setSelectedContactType(v as ContactType)}
                className="space-y-2"
              >
                <div className="flex items-start space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="applicant" id="contact-applicant" className="mt-1" />
                  <Label htmlFor="contact-applicant" className="flex-1 cursor-pointer">
                    <div className="font-medium">Applicant</div>
                    <div className="text-sm text-muted-foreground">
                      {contacts?.applicant?.phone || 'N/A'}
                    </div>
                  </Label>
                </div>
                {contacts?.co_applicants && contacts.co_applicants.length > 0 && (
                  <div className="flex items-start space-x-2 rounded-md border p-3">
                    <RadioGroupItem value="co_applicant" id="contact-coapp" className="mt-1" />
                    <Label htmlFor="contact-coapp" className="flex-1 cursor-pointer">
                      <div className="font-medium">Co-applicant</div>
                      <div className="text-sm text-muted-foreground">
                        {contacts.co_applicants[0]?.phone || 'N/A'}
                      </div>
                    </Label>
                  </div>
                )}
              </RadioGroup>
            )}
            {selectedContactType && contactMobile && (
              <div className="text-sm text-muted-foreground">Sending to: {contactMobile}</div>
            )}
          </div>

          {!otpSent && (
            <div className="flex gap-2">
              <Button onClick={handleSend} disabled={isLoading} className="w-full">
                Send OTP
              </Button>
              <Button variant="secondary" onClick={onClose} disabled={isLoading} className="w-full">
                Cancel
              </Button>
            </div>
          )}

          {otpSent && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm">OTP sent to {contactMobile || 'N/A'}</div>
                <div className="text-sm text-orange-600">Expires in: {mmss(expiresInMs)}</div>
              </div>
              <div className="text-sm text-green-600">OTP sent successfully</div>
              <div className="space-y-2">
                <Label htmlFor="otp">Enter 4-digit OTP</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  pattern="\\d{4}"
                  maxLength={4}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  className="text-center tracking-widest text-lg"
                  placeholder="••••"
                />
                <div className="text-xs text-muted-foreground">
                  Attempts left: {Math.max(0, MAX_OTP_ATTEMPTS - verificationAttempts)}
                </div>
              </div>
              {errorMessage && (
                <div className="text-sm text-red-600" role="alert">{errorMessage}</div>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={handleVerify} disabled={isLoading || verificationAttempts >= MAX_OTP_ATTEMPTS} className="w-full">
                  Verify OTP
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleResend}
                  disabled={isLoading || resendCooldownMs > 0}
                  className="w-full"
                >
                  {resendCooldownMs > 0 ? `Resend (${mmss(resendCooldownMs)})` : 'Resend'}
                </Button>
                <Button variant="ghost" onClick={onClose} disabled={isLoading} className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}


