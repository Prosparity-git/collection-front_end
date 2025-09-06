
import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount: number;
  pageSize: number;
}

const PaginationControls = memo(({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalCount, 
  pageSize 
}: PaginationControlsProps) => {
  const { startRecord, endRecord, pageNumbers } = useMemo(() => {
    const startRecord = (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(currentPage * pageSize, totalCount);
    
    // Calculate page numbers to show
    const pageNumbers = [];
    const maxPages = Math.min(5, totalPages);
    
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 5; i++) {
        pageNumbers.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pageNumbers.push(i);
      }
    }
    
    return { startRecord, endRecord, pageNumbers };
  }, [currentPage, totalPages, pageSize, totalCount]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-2 sm:px-4 py-3 bg-white border-t gap-3 sm:gap-0">
      <div className="flex items-center text-xs sm:text-sm text-gray-700">
        <span>
          Showing {startRecord} to {endRecord} of {totalCount} applications
        </span>
      </div>
      
      <div className="flex items-center space-x-1 sm:space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="text-xs sm:text-sm px-2 sm:px-3"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          Previous
        </Button>
        
        <div className="flex items-center space-x-1">
          {pageNumbers.map((pageNum) => (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className="w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm"
            >
              {pageNum}
            </Button>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="text-xs sm:text-sm px-2 sm:px-3"
        >
          Next
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
});

PaginationControls.displayName = "PaginationControls";

export default PaginationControls;
