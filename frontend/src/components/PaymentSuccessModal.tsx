import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface PaymentSuccessModalProps {
  open: boolean;
  onClose: () => void;
  amount?: number;
  status?: string;
}

export default function PaymentSuccessModal({ 
  open, 
  onClose, 
  amount,
  status 
}: PaymentSuccessModalProps) {

  const getStatusLabel = (status?: string) => {
    if (!status) return 'Payment';
    if (status === '2') return 'Partially Paid';
    if (status === '6') return 'Paid';
    return 'Payment';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl" 
        hideClose={true}
      >
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-gradient-to-b from-green-50 via-white to-white min-h-[300px] sm:min-h-[400px]">
          {/* Success Icon with Animation */}
          <div className="relative mb-6 sm:mb-8">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full p-4 sm:p-6 shadow-lg">
              <CheckCircle2 className="h-12 w-12 sm:h-16 sm:w-16 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Success Message */}
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">
            Payment Successful!
          </h2>
          
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 text-center px-4">
            {getStatusLabel(status)} status has been updated successfully
          </p>

          {/* Amount Display */}
          {amount && amount > 0 && (
            <div className="w-full max-w-xs mx-auto mb-6 sm:mb-8">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 transform transition-all hover:scale-105">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-500 mb-2 font-medium">Amount Collected</p>
                  <p className="text-2xl sm:text-4xl font-bold text-gray-900">
                    ₹{amount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Done Button */}
          <div className="w-full max-w-xs mx-auto mt-auto pt-4">
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-6 sm:py-7 text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

