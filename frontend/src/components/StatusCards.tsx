
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

interface StatusCardsProps {
  statusCounts: StatusCounts;
}

const StatusCards = ({ statusCounts }: StatusCardsProps) => {
  const [openTooltipIndex, setOpenTooltipIndex] = useState<number | null>(null);

  // Close tooltip when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openTooltipIndex !== null) {
        const target = event.target as HTMLElement;
        const isTooltipContent = target.closest('[role="tooltip"]');
        const isTooltipTrigger = target.closest('[data-radix-tooltip-trigger]');
        if (!isTooltipContent && !isTooltipTrigger) {
          setOpenTooltipIndex(null);
        }
      }
    };

    if (openTooltipIndex !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [openTooltipIndex]);

  // Tooltip texts for each status
  const tooltipTexts = {
    "Total": "Iss mahine humein jitni total collections karni hain, uska overall amount yahan dikhaya gaya hai",
    "Overdue": "Yeh wo cases hain jinke EMIs due date tak pay nahi huye — poora amount abhi bhi pending hai",
    "Overdue Paid": "Yeh cases Overdue bucket mein the, lekin ab inke EMIs poori tarah se pay ho chuke hain (due date ke baad)",
    "Partially Paid": "Yeh cases Overdue mein the aur inka sirf kuch hissa pay hua hai (partial payment due date ke baad)",
    "Paid": "Yeh cases hain jinke EMIs time par poori tarah pay ho gaye — due date se pehle ya usi din",
    "Paid (Pending Approval)": "In cases mein payment RM ne mark ki hai, par credit team se approval pending hai. Yeh payment full ya partial dono ho sakti hai",
    "Paid Rejected": "Yeh cases credit team ne reject kiye hain kyunki payment proof valid nahi mila. RM ne payment mark kiya tha par approve nahi hua"
  };

  // Safety check for null/undefined statusCounts
  if (!statusCounts) {
    return (
      <TooltipProvider>
        <div className="flex justify-center w-full">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-1 sm:gap-2 md:gap-3 w-fit">
            {Array.from({ length: 7 }).map((_, index) => (
            <Card key={index} className="bg-gray-50 border-gray-200 border shadow-sm">
              <CardHeader className="pb-1 pt-1 px-1 sm:pb-2 sm:pt-2 sm:px-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-400 text-center leading-tight">
                  Loading...
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-1 px-1 sm:pb-2 sm:px-2">
                <div className="text-sm sm:text-lg md:text-xl font-semibold text-gray-300 text-center">-</div>
              </CardContent>
            </Card>
          ))}
          </div>
        </div>
      </TooltipProvider>
    );
  }

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
      className: "bg-blue-50 border-blue-200",
      tooltip: tooltipTexts["Total"]
    },
    {
      title: "Overdue",
      value: statusCounts.overdue || 0,
      percentage: calculatePercentage(statusCounts.overdue || 0, statusCounts.total),
      className: "bg-red-50 border-red-200",
      tooltip: tooltipTexts["Overdue"]
    },
    {
      title: "Overdue Paid",
      value: statusCounts.overdue_paid || 0,
      percentage: calculatePercentage(statusCounts.overdue_paid || 0, statusCounts.total),
      className: "bg-orange-50 border-orange-200",
      tooltip: tooltipTexts["Overdue Paid"]
    },
    {
      title: "Partially Paid",
      value: statusCounts.partially_paid || 0,
      percentage: calculatePercentage(statusCounts.partially_paid || 0, statusCounts.total),
      className: "bg-yellow-50 border-yellow-200",
      tooltip: tooltipTexts["Partially Paid"]
    },
    {
      title: "Paid",
      value: statusCounts.paid || 0,
      percentage: calculatePercentage(statusCounts.paid || 0, statusCounts.total),
      className: "bg-emerald-50 border-emerald-200",
      tooltip: tooltipTexts["Paid"]
    },
    {
      title: "Foreclose",
      value: statusCounts.foreclose || 0,
      percentage: calculatePercentage(statusCounts.foreclose || 0, statusCounts.total),
      className: "bg-gray-50 border-gray-200",
      hidden: true, // Hide this card from display
      tooltip: ""
    },
    {
      title: "Paid (Pending Approval)",
      value: statusCounts.paid_pending_approval || 0,
      percentage: calculatePercentage(statusCounts.paid_pending_approval || 0, statusCounts.total),
      className: "bg-purple-50 border-purple-200",
      tooltip: tooltipTexts["Paid (Pending Approval)"]
    },
    {
      title: "Paid Rejected",
      value: statusCounts.paid_rejected || 0,
      percentage: calculatePercentage(statusCounts.paid_rejected || 0, statusCounts.total),
      className: "bg-pink-50 border-pink-200",
      hidden: true, // Hide this card from display
      tooltip: tooltipTexts["Paid Rejected"]
    }
  ];

  // Filter out hidden cards for display
  const cards = allCards.filter(card => !card.hidden);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex justify-center w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-1 sm:gap-2 md:gap-3 w-fit">
          {cards.map((card, index) => {
          const isOpen = openTooltipIndex === index;
          
          return (
            <Tooltip 
              key={index}
              open={isOpen}
              onOpenChange={(open) => {
                setOpenTooltipIndex(open ? index : null);
              }}
            >
              <TooltipTrigger asChild>
                <Card 
                  className={`${card.className} border shadow-sm cursor-pointer`}
                  onClick={(e) => {
                    // On mobile/tablet, toggle tooltip on click
                    const isTouchDevice = 'ontouchstart' in window;
                    if (isTouchDevice) {
                      e.stopPropagation();
                      setOpenTooltipIndex(isOpen ? null : index);
                    }
                  }}
                >
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
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs z-50">
                <p>{card.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default StatusCards;
