import React, { useEffect, useState } from 'react';
import { FiltersService } from '@/integrations/api/services';

const FilterTestComponent: React.FC = () => {
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setLoading(true);
        const options = await FiltersService.getAllFilterOptions();
        setFilterOptions(options);
        console.log('Filter options loaded:', options);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load filter options');
        console.error('Error loading filter options:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFilterOptions();
  }, []);

  if (loading) {
    return <div className="p-4">Loading filter options...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (!filterOptions) {
    return <div className="p-4">No filter options available</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Filter Options Test</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* EMI Months */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">EMI Months ({filterOptions.emi_months?.length || 0})</h3>
          <div className="space-y-1">
            {filterOptions.emi_months?.map((month: string, index: number) => (
              <div key={index} className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded">
                {month}
              </div>
            ))}
          </div>
        </div>

        {/* Branches */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Branches ({filterOptions.branches?.length || 0})</h3>
          <div className="space-y-1">
            {filterOptions.branches?.map((branch: string, index: number) => (
              <div key={index} className="text-sm text-green-700 bg-green-100 px-2 py-1 rounded">
                {branch}
              </div>
            ))}
          </div>
        </div>

        {/* Dealers */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-2">Dealers ({filterOptions.dealers?.length || 0})</h3>
          <div className="space-y-1">
            {filterOptions.dealers?.map((dealer: string, index: number) => (
              <div key={index} className="text-sm text-purple-700 bg-purple-100 px-2 py-1 rounded">
                {dealer}
              </div>
            ))}
          </div>
        </div>

        {/* Lenders */}
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-800 mb-2">Lenders ({filterOptions.lenders?.length || 0})</h3>
          <div className="space-y-1">
            {filterOptions.lenders?.map((lender: string, index: number) => (
              <div key={index} className="text-sm text-orange-700 bg-orange-100 px-2 py-1 rounded">
                {lender}
              </div>
            ))}
          </div>
        </div>

        {/* Statuses */}
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Statuses ({filterOptions.statuses?.length || 0})</h3>
          <div className="space-y-1">
            {filterOptions.statuses?.map((status: string, index: number) => (
              <div key={index} className="text-sm text-red-700 bg-red-100 px-2 py-1 rounded">
                {status}
              </div>
            ))}
          </div>
        </div>

        {/* PTP Date Options */}
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h3 className="font-semibold text-indigo-800 mb-2">PTP Date Options ({filterOptions.ptpDateOptions?.length || 0})</h3>
          <div className="space-y-1">
            {filterOptions.ptpDateOptions?.map((option: string, index: number) => (
              <div key={index} className="text-sm text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
                {option}
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Statuses */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Vehicle Statuses ({filterOptions.vehicle_statuses?.length || 0})</h3>
          <div className="space-y-1">
            {filterOptions.vehicle_statuses?.map((status: string, index: number) => (
              <div key={index} className="text-sm text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                {status}
              </div>
            ))}
          </div>
        </div>

        {/* Team Leads */}
        <div className="bg-pink-50 p-4 rounded-lg">
          <h3 className="font-semibold text-pink-800 mb-2">Team Leads ({filterOptions.team_leads?.length || 0})</h3>
          <div className="space-y-1">
            {filterOptions.team_leads?.map((lead: string, index: number) => (
              <div key={index} className="text-sm text-pink-700 bg-pink-100 px-2 py-1 rounded">
                {lead}
              </div>
            ))}
          </div>
        </div>

        {/* RMs */}
        <div className="bg-teal-50 p-4 rounded-lg">
          <h3 className="font-semibold text-teal-800 mb-2">RMs ({filterOptions.rms?.length || 0})</h3>
          <div className="space-y-1">
            {filterOptions.rms?.map((rm: string, index: number) => (
              <div key={index} className="text-sm text-teal-700 bg-teal-100 px-2 py-1 rounded">
                {rm}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Raw Data Display */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Raw Filter Data</h3>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
          {JSON.stringify(filterOptions, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default FilterTestComponent;
