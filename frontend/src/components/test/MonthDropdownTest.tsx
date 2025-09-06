import React from 'react';
import { useMonthDropdown } from '@/hooks/useMonthDropdown';

const MonthDropdownTest: React.FC = () => {
  // Test with loan_id 2 as shown in the API response
  const { 
    months, 
    selectedMonth, 
    handleMonthChange, 
    loading, 
    error,
    currentApplication 
  } = useMonthDropdown(2);

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Month Dropdown Test</h3>
      
      <div className="space-y-4">
        <div>
          <strong>Loan ID:</strong> 2
        </div>
        
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Error:</strong> {error || 'None'}
        </div>
        
        <div>
          <strong>Total Months:</strong> {months.length}
        </div>
        
        <div>
          <strong>Selected Month:</strong> {selectedMonth || 'None'}
        </div>
        
        <div>
          <strong>Available Months:</strong>
          <ul className="list-disc pl-4 mt-2">
            {months.map((month, index) => (
              <li key={index} className="cursor-pointer hover:text-blue-600" onClick={() => handleMonthChange(month.month)}>
                {month.month} (Repayment ID: {month.repayment_id})
              </li>
            ))}
          </ul>
        </div>
        
        {currentApplication && (
          <div>
            <strong>Current Application:</strong>
            <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">
              {JSON.stringify(currentApplication, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthDropdownTest;
