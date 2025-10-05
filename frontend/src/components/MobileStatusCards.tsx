
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application } from "@/types/application";

interface MobileStatusCardsProps {
  applications: Application[];
}

interface StatusCounts {
  total: number;
  future: number;
  overdue: number;
  partially_paid: number;
  paid: number;
  foreclose: number;
  paid_pending_approval: number;
  paid_rejected: number;
  overdue_paid: number;
}

const MobileStatusCards = ({ applications }: MobileStatusCardsProps) => {
  // Calculate counts from the applications data passed as props - match desktop logic exactly
  const statusCounts = useMemo(() => {
    const counts = applications.reduce((acc, app) => {
      acc.total++;
      
      // Count all status types exactly like desktop
      switch (app.field_status) {
        case 'Future':
          acc.future++;
          break;
        case 'Overdue':
          acc.overdue++;
          break;
        case 'Partially Paid':
          acc.partially_paid++;
          break;
        case 'Paid':
          acc.paid++;
          break;
        case 'Foreclose':
          acc.foreclose++;
          break;
        case 'Paid (Pending Approval)':
          acc.paid_pending_approval++;
          break;
        case 'Paid Rejected':
          acc.paid_rejected++;
          break;
        default:
          // Default to future if no status
          acc.future++;
          break;
      }
      
      return acc;
    }, {
      total: 0,
      future: 0,
      overdue: 0,
      partially_paid: 0,
      paid: 0,
      foreclose: 0,
      paid_pending_approval: 0,
      paid_rejected: 0
    });

    return counts;
  }, [applications]);

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return "0%";
    return `${Math.round((value / total) * 100)}%`;
  };

  // All available cards (ForeClose hidden from display)
  const allCards = [
    {
      title: "Total",
      value: statusCounts.total,
      percentage: null,
      className: "bg-blue-50 border-blue-200"
    },
    {
      title: "Overdue",
      value: statusCounts.overdue || 0,
      percentage: calculatePercentage(statusCounts.overdue || 0, statusCounts.total),
      className: "bg-red-50 border-red-200"
    },
    {
      title: "Overdue Paid",
      value: statusCounts.overdue_paid || 0,
      percentage: calculatePercentage(statusCounts.overdue_paid || 0, statusCounts.total),
      className: "bg-orange-50 border-orange-200"
    },
    {
      title: "Partially Paid",
      value: statusCounts.partially_paid || 0,
      percentage: calculatePercentage(statusCounts.partially_paid || 0, statusCounts.total),
      className: "bg-yellow-50 border-yellow-200"
    },
    {
      title: "Paid",
      value: statusCounts.paid || 0,
      percentage: calculatePercentage(statusCounts.paid || 0, statusCounts.total),
      className: "bg-emerald-50 border-emerald-200"
    },
    {
      title: "Foreclose",
      value: statusCounts.foreclose || 0,
      percentage: calculatePercentage(statusCounts.foreclose || 0, statusCounts.total),
      className: "bg-gray-50 border-gray-200",
      hidden: true // Hide this card from display
    },
    {
      title: "Paid (Pending Approval)",
      value: statusCounts.paid_pending_approval || 0,
      percentage: calculatePercentage(statusCounts.paid_pending_approval || 0, statusCounts.total),
      className: "bg-purple-50 border-purple-200"
    },
    {
      title: "Paid Rejected",
      value: statusCounts.paid_rejected || 0,
      percentage: calculatePercentage(statusCounts.paid_rejected || 0, statusCounts.total),
      className: "bg-pink-50 border-pink-200"
    }
  ];

  // Filter out hidden cards for display
  const cards = allCards.filter(card => !card.hidden);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1 sm:gap-2 md:gap-3">
      {cards.map((card, index) => (
        <Card key={index} className={`${card.className} border shadow-sm`}>
          <CardHeader className="pb-1 pt-1 px-1 sm:pb-2 sm:pt-2 sm:px-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 text-center leading-tight">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-1 px-1 sm:pb-2 sm:px-2">
            <div className="text-sm sm:text-lg md:text-xl font-semibold text-gray-800 text-center">{card.value}</div>
            {card.percentage && (
              <div className="text-xs text-gray-500 text-center mt-1">{card.percentage}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MobileStatusCards;
